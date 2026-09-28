import { normalize } from "@/lib/recipe-filters";
import type { Locale } from "@/i18n/config";

/** One base item (enchant 0) of the calculator's picker: [itemId, nameEs, nameEn, tier, station,
 * namePt]. A tuple instead of an object keeps the whole index small (~19 KB gzipped for 1,600 items
 * with es/en; Portuguese appended last so an older cached index still reads). */
export type SearchEntry = [itemId: string, nameEs: string, nameEn: string, tier: number, station: StationCode, namePt?: string];

const STATION_CODES = { alchemy: "a", refining: "r", cooking: "c", gear: "g", mount: "m" } as const;
type StationCode = (typeof STATION_CODES)[keyof typeof STATION_CODES];
const STATION_BY_CODE = Object.fromEntries(Object.entries(STATION_CODES).map(([k, v]) => [v, k])) as Record<StationCode, string>;

export type SearchHit = { itemId: string; baseItemId: string; nameEs: string; nameEn: string; namePt?: string; tier: number; stationType: string };

/** Max hits shown, same as the old server search. */
const LIMIT = 40;

export function toSearchEntry(r: {
  itemId: string;
  nameEs: string;
  nameEn: string;
  namePt?: string;
  tier: number;
  stationType: keyof typeof STATION_CODES;
}): SearchEntry {
  return [r.itemId, r.nameEs, r.nameEn, r.tier, STATION_CODES[r.stationType], r.namePt ?? r.nameEn];
}

/** Accent-insensitive substring match ("pocion" finds "Poción"). English matches English names
 * only; Spanish matches Spanish or English (players often know the English name); Portuguese matches
 * Portuguese or English, for the same reason. Sorted by the locale's own name, then tier. */
export function searchItems(index: SearchEntry[], rawQuery: string, locale: Locale): SearchHit[] {
  const q = normalize(rawQuery.trim());
  if (q.length < 2) return [];
  const own = (e: SearchEntry) => (locale === "en" ? e[2] : locale === "pt" ? (e[5] ?? e[2]) : e[1]);
  const collator = new Intl.Collator(locale);
  return index
    .filter((e) => normalize(own(e)).includes(q) || (locale !== "en" && normalize(e[2]).includes(q)))
    .sort((a, b) => collator.compare(own(a), own(b)) || a[3] - b[3])
    .slice(0, LIMIT)
    .map(([itemId, nameEs, nameEn, tier, station, namePt]) => ({ itemId, baseItemId: itemId, nameEs, nameEn, namePt, tier, stationType: STATION_BY_CODE[station] }));
}
