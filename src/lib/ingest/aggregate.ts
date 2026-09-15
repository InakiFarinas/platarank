import { BLACK_MARKET, REAL_CITIES } from "@/lib/aodp/cities";
import { parseAodpTimestamp, type AodpHistoryRow, type AodpPriceRow } from "@/lib/aodp/types";

const WINDOW_DAYS = 30;

export type CityAggregate = {
  itemId: string;
  city: string;
  price: number | null;
  priceAgeSeconds: number | null;
  avgDailyVolume30d: number;
  daysWithVolume30d: number;
  weightedAvgPrice30d: number | null;
};

/**
 * One row per city (real cities keyed off sell_price_min -- what a buyer pays; Black Market
 * keyed off buy_price_max -- what a seller receives, since it has no sell orders). No cross-city
 * reduction happens here: that's Fase 2's job, done client-side against whichever cities the
 * user picked to buy/sell in.
 */
export function computeCityAggregates(itemId: string, prices: AodpPriceRow[], history: AodpHistoryRow[], now: Date): CityAggregate[] {
  const historyByLocation = new Map(history.map((h) => [h.location, h]));
  const results: CityAggregate[] = [];

  for (const city of [...REAL_CITIES, BLACK_MARKET]) {
    const priceRow = prices.find((p) => p.city === city);
    const isBlackMarket = city === BLACK_MARKET;
    const rawPrice = priceRow ? (isBlackMarket ? priceRow.buy_price_max : priceRow.sell_price_min) : 0;
    const rawDate = priceRow ? (isBlackMarket ? priceRow.buy_price_max_date : priceRow.sell_price_min_date) : null;

    const { avgDailyVolume, daysWithVolume, weightedAvgPrice } = summarizeHistory(historyByLocation.get(city), now);

    results.push({
      itemId,
      city,
      price: rawPrice > 0 ? rawPrice : null,
      priceAgeSeconds: rawPrice > 0 && rawDate ? Math.round((now.getTime() - parseAodpTimestamp(rawDate).getTime()) / 1000) : null,
      avgDailyVolume30d: avgDailyVolume,
      daysWithVolume30d: daysWithVolume,
      weightedAvgPrice30d: weightedAvgPrice,
    });
  }

  return results;
}

function summarizeHistory(row: AodpHistoryRow | undefined, now: Date) {
  const cutoff = now.getTime() - WINDOW_DAYS * 24 * 3600 * 1000;
  if (!row) return { avgDailyVolume: 0, daysWithVolume: 0, weightedAvgPrice: null as number | null };

  const byDay = new Set<string>();
  let totalVolume = 0;
  let weightedSum = 0;
  let weightTotal = 0;

  for (const point of row.data) {
    const ts = parseAodpTimestamp(point.timestamp).getTime();
    if (ts < cutoff) continue;
    if (point.item_count > 0) byDay.add(point.timestamp.slice(0, 10));
    totalVolume += point.item_count;
    weightedSum += point.avg_price * point.item_count;
    weightTotal += point.item_count;
  }

  return {
    avgDailyVolume: totalVolume / WINDOW_DAYS,
    daysWithVolume: byDay.size,
    weightedAvgPrice: weightTotal > 0 ? weightedSum / weightTotal : null,
  };
}
