import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recipes as recipesTable, marketAggregates, type Recipe } from "@/lib/db/schema";
import { computeRecipeRow, type CityPricePoint, type RecipeMathParams, type RecipeRow } from "@/lib/recipe-math";
import { applyFilters, type FilterParams } from "@/lib/recipe-filters";

/** Rows shipped per ranking view of a large station (gear). */
export const ROW_LIMIT = 300;

export type StationType = "alchemy" | "refining" | "cooking" | "gear" | "mount";

export type StationData = { recipes: Recipe[]; marketByItem: Record<string, CityPricePoint[]> };

export async function loadStationData(stationType: StationType): Promise<StationData> {
  const recipeRows = await db.select().from(recipesTable).where(eq(recipesTable.stationType, stationType));

  const relevantItemIds = new Set<string>();
  for (const r of recipeRows) {
    relevantItemIds.add(r.itemId);
    for (const m of r.materials) relevantItemIds.add(m.itemId);
  }

  // Fetch only the aggregates this station's recipes actually reference -- with thousands of gear
  // items across the whole game, pulling the entire table for every rubro would balloon payload
  // and query time for no reason.
  const aggregateRows =
    relevantItemIds.size > 0
      ? await db
          .select()
          .from(marketAggregates)
          .where(inArray(marketAggregates.itemId, [...relevantItemIds]))
      : [];

  const marketByItem: Record<string, CityPricePoint[]> = {};
  for (const a of aggregateRows) {
    (marketByItem[a.itemId] ??= []).push({
      city: a.city,
      quality: a.quality,
      price: a.price != null ? Number(a.price) : null,
      priceAgeSeconds: a.priceAgeSeconds,
      avgDailyVolume30d: Number(a.avgDailyVolume30d),
      daysWithVolume30d: a.daysWithVolume30d,
      weightedAvgPrice30d: a.weightedAvgPrice30d != null ? Number(a.weightedAvgPrice30d) : null,
    });
  }
  return { recipes: recipeRows, marketByItem };
}

// Prices refresh hourly, so a warm serverless instance can reuse one load for a few minutes
// instead of re-reading ~230k aggregate rows on every /api/rank call.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<StationType, { at: number; data: Promise<StationData> }>();

export function loadStationDataCached(stationType: StationType): Promise<StationData> {
  const hit = cache.get(stationType);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;
  const data = loadStationData(stationType);
  cache.set(stationType, { at: Date.now(), data });
  data.catch(() => cache.delete(stationType));
  return data;
}

/** Ranks every recipe of a station with the given assumptions, filters, and returns the top rows
 * by silver/day plus the total that passed the filters. */
export function rankStation(
  data: StationData,
  params: RecipeMathParams,
  filters: FilterParams,
  limit: number,
): { rows: RecipeRow[]; total: number } {
  const market = new Map(Object.entries(data.marketByItem));
  const all = applyFilters(
    data.recipes.map((r) => computeRecipeRow(r, market, params)),
    filters,
  );
  all.sort((a, b) => (b.platinumPerDay ?? -Infinity) - (a.platinumPerDay ?? -Infinity));
  return { rows: all.slice(0, limit), total: all.length };
}
