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
