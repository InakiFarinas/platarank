// Asymmetric outlier trimming for cross-city price quotes.
//
// Rules (see brief section 4): with fewer than 3 quotes, nothing is filtered -- there's nothing
// to compare against, and filtering at n=2 can leave you with the bad one. With 3+, trim against
// the median of the set, and only the tail that affects the statistic you're about to compute:
// the low tail for a min, the high tail for a max, both tails for a median.
export const LOW_OUTLIER_FACTOR = 0.4;
export const HIGH_OUTLIER_FACTOR = 2.5;

export type CityQuote = { city: string; price: number };
export type DiscardReason = "outlier_low" | "outlier_high";
export type TrimTarget = "min" | "max" | "median";

export type TrimResult = {
  kept: CityQuote[];
  discarded: (CityQuote & { reason: DiscardReason })[];
};

export function trimOutliers(quotes: CityQuote[], target: TrimTarget): TrimResult {
  if (quotes.length < 3) {
    return { kept: quotes, discarded: [] };
  }

  const med = median(quotes.map((q) => q.price));
  const low = med * LOW_OUTLIER_FACTOR;
  const high = med * HIGH_OUTLIER_FACTOR;
  const trimLow = target === "min" || target === "median";
  const trimHigh = target === "max" || target === "median";

  const kept: CityQuote[] = [];
  const discarded: (CityQuote & { reason: DiscardReason })[] = [];
  for (const q of quotes) {
    if (trimLow && q.price < low) {
      discarded.push({ ...q, reason: "outlier_low" });
    } else if (trimHigh && q.price > high) {
      discarded.push({ ...q, reason: "outlier_high" });
    } else {
      kept.push(q);
    }
  }
  return { kept, discarded };
}

export function robustStat(quotes: CityQuote[], target: TrimTarget): { value: number | null; result: TrimResult } {
  const result = trimOutliers(quotes, target);
  if (result.kept.length === 0) {
    return { value: null, result };
  }
  const prices = result.kept.map((q) => q.price);
  const value = target === "min" ? Math.min(...prices) : target === "max" ? Math.max(...prices) : median(prices);
  return { value, result };
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
