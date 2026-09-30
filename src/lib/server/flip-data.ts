import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { rankSnapshots } from "@/lib/db/schema";
import { loadMarketFor } from "@/lib/server/station-data";
import { FLIP_ITEMS, FLIP_ITEM_IDS } from "@/lib/flip-items";
import { computeFlipRow, DEFAULT_FLIP_PARAMS, FLIP_SORT_ACCESSORS, type FlipParams, type FlipRow, type FlipSortKey } from "@/lib/flip-math";
import { applyFlipFilters, DEFAULT_FLIP_FILTERS, type FlipFilterParams } from "@/lib/flip-filters";
import type { CityPricePoint } from "@/lib/recipe-math";

/** Rows shipped per view, same ceiling gear uses. */
export const FLIP_ROW_LIMIT = 300;

/** Snapshot row key in `rank_snapshots` -- that column is a plain `text` primary key (no enum),
 * so flipping sits alongside the 5 crafting stations without a schema change. Flipping is not a
 * `StationType`: it has no recipe, no materials, no station -- forcing it into that union would
 * corrupt the exhaustiveness checks the rest of the app already runs over it. */
const FLIP_SNAPSHOT_KEY = "flipping";

export function loadFlipMarket(): Promise<Record<string, CityPricePoint[]>> {
  return loadMarketFor(FLIP_ITEM_IDS);
}

// Same process-local memo as loadStationDataCached -- within one process (the ingester's snapshot
// refresh), reuse one load instead of reading the aggregates twice. The web goes through
// shared-cache.ts instead.
const CACHE_TTL_MS = 30 * 60 * 1000;
let cached: { at: number; data: Promise<Record<string, CityPricePoint[]>> } | null = null;

export function loadFlipMarketCached(): Promise<Record<string, CityPricePoint[]>> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.data;
  const data = loadFlipMarket();
  cached = { at: Date.now(), data };
  data.catch(() => {
    cached = null;
  });
  return data;
}

/** Ranks every flippable item with the given assumptions/filters, returns the top rows under the
 * given sort plus the total that passed the filters. Sort runs BEFORE the slice to `limit`, same
 * rule as `rankStation` -- truncating before re-sorting by another column would silently hide the
 * true top rows for that column. */
export function rankFlip(
  market: Record<string, CityPricePoint[]>,
  params: FlipParams,
  filters: FlipFilterParams,
  limit: number,
  sort: { key: FlipSortKey; desc: boolean } = { key: "platinumPerDay", desc: true },
): { rows: FlipRow[]; total: number } {
  const m = new Map(Object.entries(market));
  const all = applyFlipFilters(
    FLIP_ITEMS.map((item) => computeFlipRow(item, m, params)),
    filters,
  );
  const accessor = FLIP_SORT_ACCESSORS[sort.key];
  all.sort((a, b) => (sort.desc ? accessor(b) - accessor(a) : accessor(a) - accessor(b)));
  return { rows: all.slice(0, limit), total: all.length };
}

export async function loadFlipRankSnapshot(): Promise<{ rows: FlipRow[]; total: number } | null> {
  const [row] = await db.select().from(rankSnapshots).where(eq(rankSnapshots.stationType, FLIP_SNAPSHOT_KEY));
  return row ? { rows: row.rows as FlipRow[], total: row.total } : null;
}

export async function refreshFlipRankSnapshot(): Promise<void> {
  const ranked = rankFlip(await loadFlipMarketCached(), DEFAULT_FLIP_PARAMS, DEFAULT_FLIP_FILTERS, FLIP_ROW_LIMIT);
  await db
    .insert(rankSnapshots)
    .values({ stationType: FLIP_SNAPSHOT_KEY, rows: ranked.rows, total: ranked.total })
    .onConflictDoUpdate({ target: rankSnapshots.stationType, set: { rows: ranked.rows, total: ranked.total, updatedAt: new Date() } });
}
