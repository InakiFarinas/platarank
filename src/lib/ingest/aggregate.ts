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

/** A real-city sell price this many times above the median of the item's OTHER quotes (any city,
 * any quality, plus Black Market bids) is treated as a bogus listing (e.g. a 195M order on a ~13k
 * potion) -- far beyond any real inter-city or inter-quality spread. */
export const ABSURD_PRICE_FACTOR = 20;
/** Below this, wide spreads are normal thin-market noise (cheap artifacts sell for 113 in one city
 * and 5,000 in another), so nothing is dropped no matter the ratio. */
export const ABSURD_PRICE_FLOOR = 100_000;
const MIN_REFERENCE_QUOTES = 2;

/** Zeroes out (-> "no price" downstream) real-city sell_price_min values that are absurdly above
 * what the same item trades at elsewhere. Comparing across qualities and Black Market too (not
 * just same-quality cities) catches gear whose only Q1 quote is the troll one. Needs 2+ other
 * quotes and a price of at least ABSURD_PRICE_FLOOR, so a lone or cheap quote is never dropped. */
export function dropAbsurdPrices(prices: AodpPriceRow[]): { prices: AodpPriceRow[]; dropped: AodpPriceRow[] } {
  const realCities = new Set<string>(REAL_CITIES);
  const byItem = new Map<string, AodpPriceRow[]>();
  for (const p of prices) {
    const list = byItem.get(p.item_id);
    if (list) list.push(p);
    else byItem.set(p.item_id, [p]);
  }

  const quoteOf = (p: AodpPriceRow) => (realCities.has(p.city) ? p.sell_price_min : p.city === BLACK_MARKET ? p.buy_price_max : 0);

  const absurd = new Set<AodpPriceRow>();
  for (const rows of byItem.values()) {
    for (const p of rows) {
      if (!realCities.has(p.city) || p.sell_price_min < ABSURD_PRICE_FLOOR) continue;
      const others = rows
        .filter((o) => o !== p)
        .map(quoteOf)
        .filter((v) => v > 0)
        .sort((a, b) => a - b);
      if (others.length < MIN_REFERENCE_QUOTES) continue;
      const mid = Math.floor(others.length / 2);
      const med = others.length % 2 === 0 ? (others[mid - 1] + others[mid]) / 2 : others[mid];
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
