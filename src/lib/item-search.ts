import { normalize } from "@/lib/recipe-filters";
import type { Locale } from "@/i18n/config";

/** One base item (enchant 0) of the calculator's picker: [itemId, nameEs, nameEn, tier, station].
 * A tuple instead of an object keeps the whole index at ~19 KB gzipped for 1,600 items. */
export type SearchEntry = [itemId: string, nameEs: string, nameEn: string, tier: number, station: StationCode];

const STATION_CODES = { alchemy: "a", refining: "r", cooking: "c", gear: "g", mount: "m" } as const;
type StationCode = (typeof STATION_CODES)[keyof typeof STATION_CODES];
const STATION_BY_CODE = Object.fromEntries(Object.entries(STATION_CODES).map(([k, v]) => [v, k])) as Record<StationCode, string>;

export type SearchHit = { itemId: string; baseItemId: string; nameEs: string; nameEn: string; tier: number; stationType: string };

/** Max hits shown, same as the old server search. */
const LIMIT = 40;

export function toSearchEntry(r: { itemId: string; nameEs: string; nameEn: string; tier: number; stationType: keyof typeof STATION_CODES }): SearchEntry {
  return [r.itemId, r.nameEs, r.nameEn, r.tier, STATION_CODES[r.stationType]];
}

/** Accent-insensitive substring match ("pocion" finds "Poción"), same rules the server search had:
 * English matches English names only; Spanish matches either name. Sorted by name, then tier. */
export function searchItems(index: SearchEntry[], rawQuery: string, locale: Locale): SearchHit[] {
  const q = normalize(rawQuery.trim());
  if (q.length < 2) return [];
  const en = locale === "en";
  const collator = new Intl.Collator(en ? "en" : "es");
  return index
    .filter(([, nameEs, nameEn]) => normalize(nameEn).includes(q) || (!en && normalize(nameEs).includes(q)))
    .sort((a, b) => collator.compare(en ? a[2] : a[1], en ? b[2] : b[1]) || a[3] - b[3])
    .slice(0, LIMIT)
    .map(([itemId, nameEs, nameEn, tier, station]) => ({ itemId, baseItemId: itemId, nameEs, nameEn, tier, stationType: STATION_BY_CODE[station] }));
}
