// Ingester: fetches prices + 30d history for every item referenced by an alchemy recipe,
// upserts the raw rows, recomputes the derived market_aggregates table, and purges rows
// past the retention window. Run on a schedule via .github/workflows/ingest.yml.
import "dotenv/config";
import { lt, sql } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { marketAggregates, priceQuotes, recipes, volumeDaily, type Recipe } from "../src/lib/db/schema";
import { fetchHistory, fetchPrices } from "../src/lib/aodp/client";
import { AODP_SERVERS, type AodpServer } from "../src/lib/aodp/cities";
import { computeItemAggregate } from "../src/lib/ingest/aggregate";
import recipesJson from "../src/data/generated/recipes.json";
import { parseAodpTimestamp, type AodpHistoryRow, type AodpPriceRow } from "../src/lib/aodp/types";

const recipesData = recipesJson as unknown as Recipe[];

const RETENTION_DAYS = 30;
const server: AodpServer = (process.env.AODP_SERVER as AodpServer) ?? AODP_SERVERS.americas;

async function main() {
  const now = new Date();
  console.log(`Ingesting from AODP server "${server}" at ${now.toISOString()}`);

  await syncRecipes();

  const itemIds = collectItemIds();
  console.log(`Fetching prices + history for ${itemIds.length} items...`);

  const dateFrom = new Date(now.getTime() - RETENTION_DAYS * 24 * 3600 * 1000);
  const [prices, history] = await Promise.all([
    fetchPrices(server, itemIds),
    fetchHistory(server, itemIds, dateFrom, now),
  ]);

  await storeRawPrices(prices, now);
  await storeRawHistory(history);

  await computeAndStoreAggregates(itemIds, prices, history, now);

  await purgeOldRows(now);

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

async function storeRawPrices(prices: AodpPriceRow[], fetchedAt: Date) {
  if (prices.length === 0) return;
  const rows = prices.map((p) => ({
    itemId: p.item_id,
    city: p.city,
    quality: p.quality,
    sellPriceMin: p.sell_price_min > 0 ? String(p.sell_price_min) : null,
    sellPriceMinDate: p.sell_price_min > 0 ? parseAodpTimestamp(p.sell_price_min_date) : null,
    sellPriceMax: p.sell_price_max > 0 ? String(p.sell_price_max) : null,
    sellPriceMaxDate: p.sell_price_max > 0 ? parseAodpTimestamp(p.sell_price_max_date) : null,
    buyPriceMin: p.buy_price_min > 0 ? String(p.buy_price_min) : null,
    buyPriceMinDate: p.buy_price_min > 0 ? parseAodpTimestamp(p.buy_price_min_date) : null,
    buyPriceMax: p.buy_price_max > 0 ? String(p.buy_price_max) : null,
    buyPriceMaxDate: p.buy_price_max > 0 ? parseAodpTimestamp(p.buy_price_max_date) : null,
    fetchedAt,
  }));
  for (const batch of chunk(rows, 500)) {
    await db.insert(priceQuotes).values(batch);
  }
  console.log(`Stored ${rows.length} raw price rows.`);
}

async function storeRawHistory(history: AodpHistoryRow[]) {
  const rows = history.flatMap((h) =>
    h.data.map((point) => ({
      itemId: h.item_id,
      city: h.location,
      quality: h.quality,
      date: parseAodpTimestamp(point.timestamp),
      itemCount: point.item_count,
      avgPrice: String(point.avg_price),
    })),
  );
  if (rows.length === 0) return;
  for (const batch of chunk(rows, 500)) {
    await db
      .insert(volumeDaily)
      .values(batch)
      .onConflictDoUpdate({
        target: [volumeDaily.itemId, volumeDaily.city, volumeDaily.quality, volumeDaily.date],
        set: { itemCount: sql`excluded.item_count`, avgPrice: sql`excluded.avg_price` },
      });
  }
  console.log(`Stored ${rows.length} raw history rows.`);
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function computeAndStoreAggregates(
  itemIds: string[],
  prices: AodpPriceRow[],
  history: AodpHistoryRow[],
  now: Date,
) {
  const pricesByItem = groupBy(prices, (p) => p.item_id);
  const historyByItem = groupBy(history, (h) => h.item_id);

  for (const itemId of itemIds) {
    const agg = computeItemAggregate(itemId, pricesByItem.get(itemId) ?? [], historyByItem.get(itemId) ?? [], now);
    await db
      .insert(marketAggregates)
      .values({
        itemId: agg.itemId,
        computedAt: now,
        sellRefPrice: numOrNull(agg.sellRefPrice),
        sellRefAgeSeconds: agg.sellRefAgeSeconds,
        sellRefCitiesCount: agg.sellRefCitiesCount,
        buyRefPrice: numOrNull(agg.buyRefPrice),
        buyRefAgeSeconds: agg.buyRefAgeSeconds,
        buyRefCitiesCount: agg.buyRefCitiesCount,
        bmSellPrice: numOrNull(agg.bmSellPrice),
        bmSellAgeSeconds: agg.bmSellAgeSeconds,
        bmDiscardReason: agg.bmDiscardReason,
        avgDailyVolume30d: String(agg.avgDailyVolume30d),
        bmAvgDailyVolume30d: String(agg.bmAvgDailyVolume30d),
        daysWithVolume30d: agg.daysWithVolume30d,
        qualityScore: agg.qualityScore,
        brecilienCovered: agg.brecilienCovered,
        discarded: agg.discarded,
      })
      .onConflictDoUpdate({
        target: marketAggregates.itemId,
        set: {
          computedAt: now,
          sellRefPrice: numOrNull(agg.sellRefPrice),
          sellRefAgeSeconds: agg.sellRefAgeSeconds,
          sellRefCitiesCount: agg.sellRefCitiesCount,
          buyRefPrice: numOrNull(agg.buyRefPrice),
          buyRefAgeSeconds: agg.buyRefAgeSeconds,
          buyRefCitiesCount: agg.buyRefCitiesCount,
          bmSellPrice: numOrNull(agg.bmSellPrice),
          bmSellAgeSeconds: agg.bmSellAgeSeconds,
          bmDiscardReason: agg.bmDiscardReason,
          avgDailyVolume30d: String(agg.avgDailyVolume30d),
          bmAvgDailyVolume30d: String(agg.bmAvgDailyVolume30d),
          daysWithVolume30d: agg.daysWithVolume30d,
          qualityScore: agg.qualityScore,
          brecilienCovered: agg.brecilienCovered,
          discarded: agg.discarded,
        },
      });
  }
  console.log(`Computed aggregates for ${itemIds.length} items.`);
}

async function purgeOldRows(now: Date) {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 3600 * 1000);
  await db.delete(priceQuotes).where(lt(priceQuotes.fetchedAt, cutoff));
  await db.delete(volumeDaily).where(lt(volumeDaily.date, cutoff));
  console.log(`Purged rows older than ${cutoff.toISOString()}.`);
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
