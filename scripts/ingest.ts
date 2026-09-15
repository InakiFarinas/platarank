// Ingester: fetches prices + 30d history for every item referenced by a recipe and recomputes
// the derived market_aggregates table. Run on a schedule via .github/workflows/ingest.yml.
//
// Raw price/history rows are NOT persisted -- see the note in src/lib/db/schema.ts. They're used
// in-memory to compute the aggregate, then discarded; only the upserted, storage-bounded
// market_aggregates rows land in the DB.
import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { marketAggregates, recipes, type Recipe } from "../src/lib/db/schema";
import { fetchHistory, fetchPrices } from "../src/lib/aodp/client";
import { AODP_SERVERS, type AodpServer } from "../src/lib/aodp/cities";
import { computeCityAggregates } from "../src/lib/ingest/aggregate";
import recipesJson from "../src/data/generated/recipes.json";
import type { AodpHistoryRow, AodpPriceRow } from "../src/lib/aodp/types";

const recipesData = recipesJson as unknown as Recipe[];

const RETENTION_DAYS = 30;
const server: AodpServer = (process.env.AODP_SERVER as AodpServer) ?? AODP_SERVERS.americas;

async function main() {
  const now = new Date();
  console.log(`Ingesting from AODP server "${server}" at ${now.toISOString()}`);

  await syncRecipes();

  const itemIds = collectItemIds();
  const gearItemIds = [...new Set(recipesData.filter((r) => r.stationType === "gear").map((r) => r.itemId))];
  console.log(`Fetching prices + history for ${itemIds.length} items (${gearItemIds.length} of them gear, Q1-Q5)...`);

  const dateFrom = new Date(now.getTime() - RETENTION_DAYS * 24 * 3600 * 1000);

  // Everything trades at quality 1; armas y armaduras ALSO roll quality 2-5, fetched separately
  // so alchemy/refining/cocina items and every recipe's raw materials don't pay for 5x the payload
  // they'll never use.
  const [prices, history, gearPrices, gearHistory] = await Promise.all([
    fetchPrices(server, itemIds, [1]),
    fetchHistory(server, itemIds, dateFrom, now, [1]),
    gearItemIds.length > 0 ? fetchPrices(server, gearItemIds, [2, 3, 4, 5]) : Promise.resolve([]),
    gearItemIds.length > 0 ? fetchHistory(server, gearItemIds, dateFrom, now, [2, 3, 4, 5]) : Promise.resolve([]),
  ]);

  const allPrices = [...prices, ...gearPrices];
  const allHistory = [...history, ...gearHistory];

  await computeAndStoreAggregates(itemIds, gearItemIds, allPrices, allHistory, now);

  console.log("Ingest complete.");
  process.exit(0);
}

async function syncRecipes() {
  for (const recipe of recipesData) {
    await db
      .insert(recipes)
      .values(recipe)
      .onConflictDoUpdate({ target: recipes.itemId, set: recipe });
  }
  console.log(`Synced ${recipesData.length} recipes.`);
}

function collectItemIds(): string[] {
  const ids = new Set<string>();
  for (const recipe of recipesData) {
    ids.add(recipe.itemId);
    for (const material of recipe.materials) ids.add(material.itemId);
  }
  return [...ids];
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function computeAndStoreAggregates(
  itemIds: string[],
  gearItemIds: string[],
  prices: AodpPriceRow[],
  history: AodpHistoryRow[],
  now: Date,
) {
  const pricesByItem = groupBy(prices, (p) => p.item_id);
  const historyByItem = groupBy(history, (h) => h.item_id);
  const gearItemIdSet = new Set(gearItemIds);

  const rows = itemIds.flatMap((itemId) => {
    const qualities = gearItemIdSet.has(itemId) ? [1, 2, 3, 4, 5] : [1];
    return qualities.flatMap((quality) =>
      computeCityAggregates(itemId, pricesByItem.get(itemId) ?? [], historyByItem.get(itemId) ?? [], now, quality).map(
        (agg) => ({
          itemId: agg.itemId,
          city: agg.city,
          quality: agg.quality,
          computedAt: now,
          price: numOrNull(agg.price),
          priceAgeSeconds: agg.priceAgeSeconds,
          avgDailyVolume30d: String(agg.avgDailyVolume30d),
          daysWithVolume30d: agg.daysWithVolume30d,
          weightedAvgPrice30d: numOrNull(agg.weightedAvgPrice30d),
        }),
      ),
    );
  });

  for (const batch of chunk(rows, 500)) {
    await db
      .insert(marketAggregates)
      .values(batch)
      .onConflictDoUpdate({
        target: [marketAggregates.itemId, marketAggregates.city, marketAggregates.quality],
        set: {
          computedAt: sql`excluded.computed_at`,
          price: sql`excluded.price`,
          priceAgeSeconds: sql`excluded.price_age_seconds`,
          avgDailyVolume30d: sql`excluded.avg_daily_volume_30d`,
          daysWithVolume30d: sql`excluded.days_with_volume_30d`,
          weightedAvgPrice30d: sql`excluded.weighted_avg_price_30d`,
        },
      });
  }
  console.log(`Computed ${rows.length} item-city-quality aggregates for ${itemIds.length} items.`);
}

function numOrNull(v: number | null): string | null {
  return v === null ? null : String(v);
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
