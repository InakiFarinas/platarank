import type { FlipRow } from "@/lib/flip-math";
import type { Locale } from "@/i18n/config";
import { itemName } from "@/lib/item-names";
import { normalize } from "@/lib/recipe-filters";

export type FlipFilterParams = {
  nameQuery: string;
  minMarginPct: number | null;
  minVolume: number | null;
  maxAgeHours: number | null;
};

export const DEFAULT_FLIP_FILTERS: FlipFilterParams = { nameQuery: "", minMarginPct: null, minVolume: null, maxAgeHours: null };

export function applyFlipFilters(rows: FlipRow[], filters: FlipFilterParams, locale: Locale = "es"): FlipRow[] {
  const query = normalize(filters.nameQuery.trim());
  return rows.filter((r) => {
    if (query !== "" && !normalize(itemName(r.item, locale)).includes(query)) return false;
    if (filters.minMarginPct !== null && (r.marginPct ?? -Infinity) < filters.minMarginPct / 100) return false;
    if (filters.minVolume !== null && r.avgDailyVolume30d < filters.minVolume) return false;
    if (filters.maxAgeHours !== null) {
      const ageSeconds = Math.max(r.buyAgeSeconds ?? Infinity, r.sellAgeSeconds ?? Infinity);
      const ageHours = ageSeconds === Infinity ? Infinity : ageSeconds / 3600;
      if (ageHours > filters.maxAgeHours) return false;
    }
    return true;
  });
}
