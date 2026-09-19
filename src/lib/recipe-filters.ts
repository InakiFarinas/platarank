import type { RecipeRow } from "@/lib/recipe-math";

export type FilterParams = {
  nameQuery: string;
  maxAgeHours: number | null;
  minVolume: number | null;
};

export const DEFAULT_FILTERS: FilterParams = { nameQuery: "", maxAgeHours: null, minVolume: null };

/** Strips accents so "pocion" matches "Poción" -- players typing on a phone next to the game
 * shouldn't have to hit the right diacritic to find an item. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function applyFilters(rows: RecipeRow[], filters: FilterParams): RecipeRow[] {
  const query = normalize(filters.nameQuery.trim());
  return rows.filter((r) => {
    if (query !== "" && !normalize(r.recipe.nameEs).includes(query)) return false;
    if (filters.maxAgeHours !== null) {
      const ageHours = r.sellRefAgeSeconds !== null ? r.sellRefAgeSeconds / 3600 : Infinity;
      if (ageHours > filters.maxAgeHours) return false;
    }
    if (filters.minVolume !== null && r.avgDailyVolume30d < filters.minVolume) return false;
    return true;
  });
}
