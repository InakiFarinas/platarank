import { HIGH_OUTLIER_FACTOR, robustStat, type CityQuote } from "@/lib/formulas/outliers";
import { computeQualityScore } from "@/lib/formulas/quality-score";
import { BLACK_MARKET, REAL_CITIES } from "@/lib/aodp/cities";
import { parseAodpTimestamp, type AodpHistoryRow, type AodpPriceRow } from "@/lib/aodp/types";
import type { DiscardedQuote } from "@/lib/db/schema";

const WINDOW_DAYS = 30;

export type ItemAggregate = {
  itemId: string;
  sellRefPrice: number | null;
  sellRefAgeSeconds: number | null;
  sellRefCitiesCount: number;
  buyRefPrice: number | null;
  buyRefAgeSeconds: number | null;
  buyRefCitiesCount: number;
  bmSellPrice: number | null;
  bmSellAgeSeconds: number | null;
  bmDiscardReason: "no_data" | "outlier_high" | null;
  avgDailyVolume30d: number;
  bmAvgDailyVolume30d: number;
  daysWithVolume30d: number;
  qualityScore: number;
  brecilienCovered: boolean;
  discarded: DiscardedQuote[];
};

export function computeItemAggregate(
  itemId: string,
  prices: AodpPriceRow[],
  history: AodpHistoryRow[],
  now: Date,
): ItemAggregate {
  const realCityPrices = prices.filter((p) => (REAL_CITIES as readonly string[]).includes(p.city));
  const bmPrice = prices.find((p) => p.city === BLACK_MARKET);

  const quotes: CityQuote[] = realCityPrices
    .filter((p) => p.sell_price_min > 0)
    .map((p) => ({ city: p.city, price: p.sell_price_min }));
  const quoteDates = new Map(
    realCityPrices.filter((p) => p.sell_price_min > 0).map((p) => [p.city, parseAodpTimestamp(p.sell_price_min_date)]),
  );

  const sellStat = robustStat(quotes, "median");
  const buyStat = robustStat(quotes, "min");

  const discarded: DiscardedQuote[] = dedupeDiscards([...sellStat.result.discarded, ...buyStat.result.discarded]);

  const sellRefAgeSeconds = oldestAgeSeconds(sellStat.result.kept, quoteDates, now);
  const buyRefAgeSeconds = oldestAgeSeconds(buyStat.result.kept, quoteDates, now);

  const realCityHistory = history.filter((h) => (REAL_CITIES as readonly string[]).includes(h.location));
  const bmHistory = history.find((h) => h.location === BLACK_MARKET);

  const { avgDailyVolume, daysWithVolume, weightedAvgPrice } = summarizeHistory(realCityHistory, now);
  const { avgDailyVolume: bmAvgDailyVolume, weightedAvgPrice: bmWeightedAvgPrice } = summarizeHistory(
    bmHistory ? [bmHistory] : [],
    now,
  );

  const deviationFromHistorical =
    sellStat.value !== null && weightedAvgPrice !== null
      ? Math.abs(sellStat.value - weightedAvgPrice) / weightedAvgPrice
      : 0;

  const qualityScore = computeQualityScore({
    oldestQuoteAgeHours: sellRefAgeSeconds !== null ? sellRefAgeSeconds / 3600 : 9999,
    citiesQuoted: quotes.length,
    daysWithVolume,
    windowDays: WINDOW_DAYS,
    deviationFromHistorical,
  });

  const { bmSellPrice, bmSellAgeSeconds, bmDiscardReason } = evaluateBlackMarket(bmPrice, bmWeightedAvgPrice, now);

  return {
    itemId,
    sellRefPrice: sellStat.value,
    sellRefAgeSeconds,
    sellRefCitiesCount: sellStat.result.kept.length,
    buyRefPrice: buyStat.value,
    buyRefAgeSeconds,
    buyRefCitiesCount: buyStat.result.kept.length,
    bmSellPrice,
    bmSellAgeSeconds,
    bmDiscardReason,
    avgDailyVolume30d: avgDailyVolume,
    bmAvgDailyVolume30d: bmAvgDailyVolume,
    daysWithVolume30d: daysWithVolume,
    qualityScore,
    brecilienCovered: quotes.some((q) => q.city === "Brecilien"),
    discarded,
  };
}

function evaluateBlackMarket(bmPrice: AodpPriceRow | undefined, bmWeightedAvgPrice: number | null, now: Date) {
  if (!bmPrice || bmPrice.buy_price_max <= 0) {
    return { bmSellPrice: null, bmSellAgeSeconds: null, bmDiscardReason: "no_data" as const };
  }
  const age = Math.round((now.getTime() - parseAodpTimestamp(bmPrice.buy_price_max_date).getTime()) / 1000);
  if (bmWeightedAvgPrice !== null && bmPrice.buy_price_max > bmWeightedAvgPrice * HIGH_OUTLIER_FACTOR) {
    return { bmSellPrice: null, bmSellAgeSeconds: age, bmDiscardReason: "outlier_high" as const };
  }
  return { bmSellPrice: bmPrice.buy_price_max, bmSellAgeSeconds: age, bmDiscardReason: null };
}

function summarizeHistory(rows: AodpHistoryRow[], now: Date) {
  const cutoff = now.getTime() - WINDOW_DAYS * 24 * 3600 * 1000;
  const byDay = new Map<string, number>(); // day key -> total item_count across cities
  let weightedSum = 0;
  let weightTotal = 0;

  for (const row of rows) {
    for (const point of row.data) {
      const ts = parseAodpTimestamp(point.timestamp).getTime();
      if (ts < cutoff) continue;
      const dayKey = point.timestamp.slice(0, 10);
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + point.item_count);
      weightedSum += point.avg_price * point.item_count;
      weightTotal += point.item_count;
    }
  }

  const totalVolume = [...byDay.values()].reduce((a, b) => a + b, 0);
  return {
    avgDailyVolume: totalVolume / WINDOW_DAYS,
    daysWithVolume: [...byDay.values()].filter((v) => v > 0).length,
    weightedAvgPrice: weightTotal > 0 ? weightedSum / weightTotal : null,
  };
}

function oldestAgeSeconds(kept: CityQuote[], dates: Map<string, Date>, now: Date): number | null {
  if (kept.length === 0) return null;
  const ages = kept.map((q) => now.getTime() - (dates.get(q.city)?.getTime() ?? now.getTime()));
  return Math.round(Math.max(...ages) / 1000);
}

function dedupeDiscards(
  entries: { city: string; price: number; reason: "outlier_low" | "outlier_high" }[],
): DiscardedQuote[] {
  const seen = new Set<string>();
  const result: DiscardedQuote[] = [];
  for (const e of entries) {
    const key = `${e.city}:${e.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ city: e.city, field: "sell_price_min", price: e.price, reason: e.reason });
  }
  return result;
}
