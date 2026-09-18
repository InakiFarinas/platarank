import { BLACK_MARKET, REAL_CITIES } from "@/lib/aodp/cities";
import type { DumpVolumeSummary } from "@/lib/aodp/dumps";
import { parseAodpTimestamp, type AodpPriceRow } from "@/lib/aodp/types";

export type CityPrice = {
  itemId: string;
  city: string;
  quality: number;
  price: number | null;
  priceAgeSeconds: number | null;
};

export type CityAggregate = CityPrice & DumpVolumeSummary;

const EMPTY_VOLUME: DumpVolumeSummary = { avgDailyVolume30d: 0, daysWithVolume30d: 0, weightedAvgPrice30d: null };

/** A real-city sell price this many times above the median of the item's other cities is treated
 * as a bogus listing (e.g. a 195M order on a ~13k potion) -- far beyond any real inter-city spread. */
export const ABSURD_PRICE_FACTOR = 20;
const MIN_OTHER_CITIES = 2;

/** Zeroes out (-> "no price" downstream) real-city sell_price_min values that are absurdly above
 * what the same item/quality sells for elsewhere. Needs 2+ other cities to compare against, so a
 * lone quote is never dropped. Returns a new array plus how many rows were cleared. */
export function dropAbsurdPrices(prices: AodpPriceRow[]): { prices: AodpPriceRow[]; dropped: AodpPriceRow[] } {
  const realCities = new Set<string>(REAL_CITIES);
  const groups = new Map<string, AodpPriceRow[]>();
  for (const p of prices) {
    if (!realCities.has(p.city) || p.sell_price_min <= 0) continue;
    const key = `${p.item_id}|${p.quality}`;
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  }

  const absurd = new Set<AodpPriceRow>();
  for (const group of groups.values()) {
    if (group.length < MIN_OTHER_CITIES + 1) continue;
    for (const p of group) {
      const others = group.filter((o) => o !== p).map((o) => o.sell_price_min);
      const sorted = others.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const med = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
      if (p.sell_price_min > med * ABSURD_PRICE_FACTOR) absurd.add(p);
    }
  }

  return {
    prices: prices.map((p) => (absurd.has(p) ? { ...p, sell_price_min: 0 } : p)),
    dropped: [...absurd],
  };
}

/** Real cities are keyed off sell_price_min -- what a buyer pays; Black Market is keyed off
 * buy_price_max -- what a seller receives, since it has no sell orders. */
export function computeCityPrice(itemId: string, prices: AodpPriceRow[], now: Date, city: string, quality: number): CityPrice {
  const priceRow = prices.find((p) => p.city === city && p.quality === quality);
  const isBlackMarket = city === BLACK_MARKET;
  const rawPrice = priceRow ? (isBlackMarket ? priceRow.buy_price_max : priceRow.sell_price_min) : 0;
  const rawDate = priceRow ? (isBlackMarket ? priceRow.buy_price_max_date : priceRow.sell_price_min_date) : null;

  return {
    itemId,
    city,
    quality,
    price: rawPrice > 0 ? rawPrice : null,
    priceAgeSeconds: rawPrice > 0 && rawDate ? Math.round((now.getTime() - parseAodpTimestamp(rawDate).getTime()) / 1000) : null,
  };
}

/**
 * One row per city (real cities off sell_price_min, Black Market off buy_price_max -- see
 * computeCityPrice). Volume comes from the daily AODP dump (see src/lib/aodp/dumps.ts), keyed by
 * `${itemId}|${quality}|${city}`; a missing entry means no trades in the last 30 days there. No
 * cross-city reduction happens here: that's Fase 2's job, done client-side against whichever
 * cities the user picked to buy/sell in.
 */
export function computeCityAggregates(
  itemId: string,
  prices: AodpPriceRow[],
  volumeSummaries: Map<string, DumpVolumeSummary>,
  now: Date,
  quality = 1,
): CityAggregate[] {
  return [...REAL_CITIES, BLACK_MARKET].map((city) => ({
    ...computeCityPrice(itemId, prices, now, city, quality),
    ...(volumeSummaries.get(`${itemId}|${quality}|${city}`) ?? EMPTY_VOLUME),
  }));
}
