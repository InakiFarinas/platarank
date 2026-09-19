import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recipes } from "@/lib/db/schema";
import { DEFAULT_PARAMS, type RecipeRow } from "@/lib/recipe-math";
import { loadStationData, rankStation, type StationType } from "@/lib/server/station-data";

export const STATIONS: { type: StationType; label: string; path: string }[] = [
  { type: "alchemy", label: "Alquimia", path: "alquimia" },
  { type: "refining", label: "Refinado", path: "refinado" },
  { type: "cooking", label: "Cocina", path: "cocina" },
  { type: "gear", label: "Equipo", path: "equipo" },
  { type: "mount", label: "Monturas", path: "monturas" },
];

// Public surfaces (home page, Discord digest) must not headline artifacts: real crafting margins
// above ~150% are almost always a bad quote, and a volume driven by a couple of days of trades
// (one spike) is not a daily rate.
const MAX_MARGIN = 1.5;
const MIN_DAYS_OF_TOP_VOLUME = 15;
const FILTERS = { nameQuery: "", maxAgeHours: 24, minVolume: 10 };

export type TopRecipe = { label: string; path: string; row: RecipeRow };

/** The best recipes right now by realizable silver/day across every station, with default
 * assumptions (Brecilien, no focus, 10% market share) and the sanity filters above. */
export async function getTopRecipes(limit = 5): Promise<TopRecipe[]> {
  const all: TopRecipe[] = [];
  for (const s of STATIONS) {
    const data = await loadStationData(s.type);
    // Rank deep (not just `limit`) since the sanity checks discard rows after ranking.
    for (const row of rankStation(data, DEFAULT_PARAMS, FILTERS, 60).rows) {
      if (row.marginPct === null || row.marginPct > MAX_MARGIN) continue;
      const points = data.marketByItem[row.recipe.itemId] ?? [];
      const biggest = points.reduce((a, b) => (b.avgDailyVolume30d > (a?.avgDailyVolume30d ?? -1) ? b : a), points[0]);
      if (!biggest || biggest.daysWithVolume30d < MIN_DAYS_OF_TOP_VOLUME) continue;
      all.push({ label: s.label, path: s.path, row });
    }
  }
  all.sort((a, b) => (b.row.platinumPerDay ?? 0) - (a.row.platinumPerDay ?? 0));
  return all.filter((x) => (x.row.platinumPerDay ?? 0) > 0).slice(0, limit);
}

export async function getRecipeCounts(): Promise<Record<string, number>> {
  const rows = await db.select({ type: recipes.stationType, n: sql<number>`count(*)::int` }).from(recipes).groupBy(recipes.stationType);
  return Object.fromEntries(rows.map((r) => [r.type, r.n]));
}
