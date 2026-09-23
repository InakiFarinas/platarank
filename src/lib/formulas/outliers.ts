// Asymmetric outlier trimming for cross-city price quotes.
//
// Rules (see brief section 4): with fewer than 3 quotes, nothing is cross-city-filtered -- there's
// nothing to compare against, and filtering at n=2 can leave you with the bad one. With 3+, trim
// against the median of the set, and only the tail that affects the statistic you're about to
// compute: the low tail for a min, the high tail for a max, both tails for a median.
export const LOW_OUTLIER_FACTOR = 0.4;
export const HIGH_OUTLIER_FACTOR = 2.5;

export type CityQuote = {
  city: string;
  price: number;
  /** That city's own 30-day weighted average, when known. A live price this far from the city's
   * OWN history is a bait/stale listing regardless of how many other cities are being compared --
   * this is the only check that can catch a lone quote (n=1), where cross-city trimming has
   * nothing to trim against (see /impeccable bug report 2026-09-23: a single Brecilien listing at
   * 16.0M against its own weighted 33.3k average inflated a recipe to 2.8B plata/día). */
  selfRef?: number | null;
};
export type DiscardReason = "outlier_low" | "outlier_high" | "outlier_self";
export type TrimTarget = "min" | "max" | "median";

export type TrimResult = {
  kept: CityQuote[];
  discarded: (CityQuote & { reason: DiscardReason })[];
};

export function trimOutliers(quotes: CityQuote[], target: TrimTarget): TrimResult {
  const discarded: (CityQuote & { reason: DiscardReason })[] = [];
  const selfChecked: CityQuote[] = [];
  for (const q of quotes) {
    if (q.selfRef != null && (q.price < q.selfRef * LOW_OUTLIER_FACTOR || q.price > q.selfRef * HIGH_OUTLIER_FACTOR)) {
      discarded.push({ ...q, reason: "outlier_self" });
    } else {
      selfChecked.push(q);
    }
  }

  if (selfChecked.length < 3) {
    return { kept: selfChecked, discarded };
  }

  const med = median(selfChecked.map((q) => q.price));
  const low = med * LOW_OUTLIER_FACTOR;
  const high = med * HIGH_OUTLIER_FACTOR;
  const trimLow = target === "min" || target === "median";
  const trimHigh = target === "max" || target === "median";

  const kept: CityQuote[] = [];
  for (const q of selfChecked) {
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
