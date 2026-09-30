// Ingester: fetches current prices for every item referenced by a recipe (REST, hourly) and
// 30-day volume from AODP's daily dump (only re-parsed when a new dump appears), then recomputes
// the derived market_aggregates table. Run on a schedule via .github/workflows/ingest.yml.
//
// Raw price rows are NOT persisted -- see the note in src/lib/db/schema.ts. They're used in-memory
// to compute the aggregate, then discarded; only the upserted, storage-bounded market_aggregates
// rows land in the DB.
import "dotenv/config";
import { sql, eq, lt, getTableColumns } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { ingestState, marketAggregates, recipes, type Recipe } from "../src/lib/db/schema";
import { fetchPrices } from "../src/lib/aodp/client";
import { AODP_SERVERS, ALL_LOCATIONS as REAL_CITIES_AND_BM, type AodpServer } from "../src/lib/aodp/cities";
import { findLatestDumpUrl, fetchDumpVolumeSummaries, type DumpVolumeSummary } from "../src/lib/aodp/dumps";
import { fetchClusterIdToLocation } from "../src/lib/aodp/world";
import { ABSURD_PRICE_FACTOR, computeCityAggregates, computeCityPrice, dropAbsurdPrices } from "../src/lib/ingest/aggregate";
import { ALL_BREEDING_MARKET_ITEMS } from "../src/lib/formulas/breeding";
import { ARTIFACT_MARKET_ITEMS } from "../src/lib/artifacts";
import { ALL_JOURNAL_MARKET_ITEMS } from "../src/lib/journals";
import { RAW_RESOURCES } from "../src/lib/raw-resources-data";
import { runAlerts } from "../src/lib/ingest/alerts";
import { refreshRankSnapshot } from "../src/lib/server/station-data";
import { refreshTopRecipesSnapshot } from "../src/lib/server/top-recipes";
import { refreshFlipRankSnapshot } from "../src/lib/server/flip-data";
import recipesJson from "../src/data/generated/recipes.json";
import type { AodpPriceRow } from "../src/lib/aodp/types";

const recipesData = recipesJson as unknown as Recipe[];

const LAST_DUMP_URL_KEY = "last_dump_url";
const server: AodpServer = (process.env.AODP_SERVER as AodpServer) ?? AODP_SERVERS.americas;

async function main() {
  const now = new Date();
  console.log(`Ingesting from AODP server "${server}" at ${now.toISOString()}`);

  await syncRecipes();

  const itemIds = collectItemIds();
  const gearItemIds = [...new Set(recipesData.filter((r) => r.stationType === "gear").map((r) => r.itemId))];
  const gearItemIdSet = new Set(gearItemIds);
  console.log(`Fetching prices for ${itemIds.length} items (${gearItemIds.length} of them gear, Q1-Q5)...`);

  const [prices, gearPrices] = await Promise.all([
    fetchPrices(server, itemIds, [1]),
    gearItemIds.length > 0 ? fetchPrices(server, gearItemIds, [2, 3, 4, 5]) : Promise.resolve([]),
  ]);
  const { prices: allPrices, dropped } = dropAbsurdPrices([...prices, ...gearPrices]);
  if (dropped.length > 0) {
    console.log(`Dropped ${dropped.length} absurd sell prices (>${ABSURD_PRICE_FACTOR}x the other cities' median):`);
    for (const p of dropped.slice(0, 20)) console.log(`  ${p.item_id} q${p.quality} ${p.city}: ${p.sell_price_min}`);
  }

  const dumpUrl = await findLatestDumpUrl(server);
  const lastProcessedUrl = await getLastProcessedDumpUrl();
  // FORCE_DUMP=1 re-parses today's dump even if already processed -- needed after new recipes are
  // added, since otherwise their volume stays empty until tomorrow's dump.
  const isNewDump = dumpUrl !== lastProcessedUrl || process.env.FORCE_DUMP === "1";

  if (isNewDump) {
    console.log(`New daily dump detected (${dumpUrl}); downloading and recomputing 30-day volume...`);
    const clusterIdToLocation = await fetchClusterIdToLocation();
    const volumeSummaries = await fetchDumpVolumeSummaries(dumpUrl, new Set(itemIds), clusterIdToLocation, now);
    console.log(`Parsed volume for ${volumeSummaries.size} item-city-quality combinations from the dump.`);
    await storeFullAggregates(itemIds, gearItemIdSet, allPrices, volumeSummaries, now);
    await setLastProcessedDumpUrl(dumpUrl);
  } else {
    console.log(`Dump unchanged since last run (${dumpUrl}); refreshing prices only.`);
    await storePriceOnlyUpdates(itemIds, gearItemIdSet, allPrices, now);
  }

  try {
    await runAlerts(now);
  } catch (err) {
    // Alerts are best-effort: a Discord/DB hiccup must not fail the price ingest itself.
    console.error("Alert check failed:", err);
  }

  // Reading the gear aggregates back costs ~8 MB of Supabase egress (5 GB/month on the free plan), so
  // the default-view snapshot refreshes every 6 hours and on a new daily dump, not every run.
  if (isNewDump || now.getUTCHours() % 6 === 0 || process.env.FORCE_SNAPSHOT === "1") {
    try {
      await refreshRankSnapshot("gear");
      await refreshTopRecipesSnapshot();
      await refreshFlipRankSnapshot();
      console.log("Refreshed the gear, home and flipping snapshots.");
    } catch (err) {
      console.error("Rank snapshot refresh failed:", err);
    }
  }

  console.log("Ingest complete.");
  process.exit(0);
}

async function getLastProcessedDumpUrl(): Promise<string | null> {
  const rows = await db.select().from(ingestState).where(eq(ingestState.key, LAST_DUMP_URL_KEY));
  return rows[0]?.value ?? null;
}

async function setLastProcessedDumpUrl(url: string) {
  await db
    .insert(ingestState)
    .values({ key: LAST_DUMP_URL_KEY, value: url })
    .onConflictDoUpdate({ target: ingestState.key, set: { value: url } });
}

async function syncRecipes() {
  // Every column but the primary key is overwritten from the incoming row.
  const set = Object.fromEntries(
    Object.entries(getTableColumns(recipes))
      .filter(([key]) => key !== "itemId")
      .map(([key, col]) => [key, sql.raw(`excluded."${col.name}"`)]),
  );
  for (const batch of chunk(recipesData, 200)) {
    await db.insert(recipes).values(batch).onConflictDoUpdate({ target: recipes.itemId, set });
  }
  console.log(`Synced ${recipesData.length} recipes.`);
}

function collectItemIds(): string[] {
  const ids = new Set<string>();
  for (const recipe of recipesData) {
    ids.add(recipe.itemId);
    for (const material of recipe.materials) ids.add(material.itemId);
  }
  // Monturas: feed crops/meat and market-traded babies for the "criar por tu cuenta" toggle; they
  // aren't materials of any mount recipe, so they'd otherwise never be priced.
  for (const itemId of ALL_BREEDING_MARKET_ITEMS) ids.add(itemId);
  // Equipo: the empty and full labourer journals a gear craft fills (src/lib/journals.ts).
  for (const itemId of ALL_JOURNAL_MARKET_ITEMS) ids.add(itemId);
  // Artifact Foundry (/artefactos): the fragments and every artifact they can roll into.
  for (const itemId of ARTIFACT_MARKET_ITEMS) ids.add(itemId);
  // Flipping (/flipping): raw gatherable resources aren't a material of any recipe (players gather
  // them free), but they're real, named, market-traded goods a flipper buys and sells cross-city.
  for (const r of RAW_RESOURCES) ids.add(r.itemId);
  return [...ids];
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/** Full recompute: prices + volume, for when a new daily dump just landed. */
async function storeFullAggregates(
  itemIds: string[],
  gearItemIdSet: Set<string>,
  prices: AodpPriceRow[],
  volumeSummaries: Map<string, DumpVolumeSummary>,
  now: Date,
) {
  const pricesByItem = groupBy(prices, (p) => p.item_id);

  const rows = itemIds.flatMap((itemId) => {
    const qualities = gearItemIdSet.has(itemId) ? [1, 2, 3, 4, 5] : [1];
    return qualities.flatMap((quality) =>
      computeCityAggregates(itemId, pricesByItem.get(itemId) ?? [], volumeSummaries, now, quality).map((agg) => ({
        itemId: agg.itemId,
        city: agg.city,
        quality: agg.quality,
        computedAt: now,
        price: numOrNull(agg.price),
        priceAgeSeconds: agg.priceAgeSeconds,
        buyPriceMax: numOrNull(agg.buyPriceMax),
        avgDailyVolume30d: String(agg.avgDailyVolume30d),
        daysWithVolume30d: agg.daysWithVolume30d,
        weightedAvgPrice30d: numOrNull(agg.weightedAvgPrice30d),
      })),
    );
  });

  // A combination with no price, no volume and no standing buy order carries no information
  // (every reader skips unpriced points and only counts volume from priced ones), so it isn't
  // stored -- ~70% of them are empty, and they'd otherwise ship on every ranking load.
  const kept = rows.filter((r) => r.price !== null || Number(r.avgDailyVolume30d) > 0 || r.buyPriceMax !== null);
  for (const batch of chunk(kept, 500)) {
    await db
      .insert(marketAggregates)
      .values(batch)
      .onConflictDoUpdate({
        target: [marketAggregates.itemId, marketAggregates.city, marketAggregates.quality],
        set: {
          computedAt: sql`excluded.computed_at`,
          price: sql`excluded.price`,
          priceAgeSeconds: sql`excluded.price_age_seconds`,
          buyPriceMax: sql`excluded.buy_price_max`,
          avgDailyVolume30d: sql`excluded.avg_daily_volume_30d`,
          daysWithVolume30d: sql`excluded.days_with_volume_30d`,
          weightedAvgPrice30d: sql`excluded.weighted_avg_price_30d`,
        },
      });
  }
  // Everything stored was just rewritten with computedAt = now, so any older row is one that went
  // empty (or belongs to an item no recipe references anymore).
  await db.delete(marketAggregates).where(lt(marketAggregates.computedAt, now));
  console.log(`Stored ${kept.length} of ${rows.length} item-city-quality aggregates (prices + volume) for ${itemIds.length} items.`);
}

/** Cheap hourly path: current price only, leaving the dump-derived volume columns untouched. */
async function storePriceOnlyUpdates(itemIds: string[], gearItemIdSet: Set<string>, prices: AodpPriceRow[], now: Date) {
  const pricesByItem = groupBy(prices, (p) => p.item_id);

  const rows = itemIds.flatMap((itemId) => {
    const qualities = gearItemIdSet.has(itemId) ? [1, 2, 3, 4, 5] : [1];
    return qualities.flatMap((quality) =>
      [...REAL_CITIES_AND_BM].map((city) => {
        const cp = computeCityPrice(itemId, pricesByItem.get(itemId) ?? [], now, city, quality);
        return {
          itemId: cp.itemId,
          city: cp.city,
          quality: cp.quality,
          computedAt: now,
          price: numOrNull(cp.price),
          priceAgeSeconds: cp.priceAgeSeconds,
          buyPriceMax: numOrNull(cp.buyPriceMax),
          // Required by the insert type; ignored by onConflictDoUpdate's set below, which omits them.
          avgDailyVolume30d: "0",
          daysWithVolume30d: 0,
          weightedAvgPrice30d: null as string | null,
        };
      }),
    );
  });

  // Only combinations with a sell price or a standing buy order are written; one that lost both is
  // handled below.
  const priced = rows.filter((r) => r.price !== null || r.buyPriceMax !== null);
  for (const batch of chunk(priced, 500)) {
    await db
      .insert(marketAggregates)
      .values(batch)
      .onConflictDoUpdate({
        target: [marketAggregates.itemId, marketAggregates.city, marketAggregates.quality],
        set: {
          computedAt: sql`excluded.computed_at`,
          price: sql`excluded.price`,
          priceAgeSeconds: sql`excluded.price_age_seconds`,
          buyPriceMax: sql`excluded.buy_price_max`,
        },
      });
  }
  // Rows not refreshed above have neither a live price nor a live buy order anymore: clear both
  // (volume stays), then drop the ones that are now empty.
  await db
    .update(marketAggregates)
    .set({ price: null, buyPriceMax: null, priceAgeSeconds: null, computedAt: now })
    .where(
      sql`${marketAggregates.computedAt} < ${now.toISOString()} and (${marketAggregates.price} is not null or ${marketAggregates.buyPriceMax} is not null)`,
    );
  await db
    .delete(marketAggregates)
    .where(sql`${marketAggregates.price} is null and ${marketAggregates.buyPriceMax} is null and ${marketAggregates.avgDailyVolume30d} = 0`);
  console.log(`Refreshed prices for ${priced.length} of ${rows.length} item-city-quality combinations (volume left untouched).`);
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
