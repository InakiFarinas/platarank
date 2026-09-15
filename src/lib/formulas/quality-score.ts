// Visible per-row data quality score (0-100), combining the four signals called out in the
// brief: age of the OLDEST input (not the average), city coverage, days with nonzero volume,
// and deviation against the volume-weighted historical price. Equal 25-point weights; published
// and open to revision in /metodologia once that page exists.
const TOTAL_CITIES = 8; // 7 real cities + Black Market
const MAX_AGE_HOURS_FOR_ZERO_FRESHNESS = 72;
const MAX_DEVIATION_FOR_ZERO_STABILITY = 0.5; // 50% off the volume-weighted historical price

export type QualityScoreInputs = {
  oldestQuoteAgeHours: number;
  citiesQuoted: number;
  daysWithVolume: number;
  windowDays: number;
  deviationFromHistorical: number; // abs(current - historical) / historical
};

export function computeQualityScore(inputs: QualityScoreInputs): number {
  const freshness = 100 * clamp01(1 - inputs.oldestQuoteAgeHours / MAX_AGE_HOURS_FOR_ZERO_FRESHNESS);
  const coverage = 100 * clamp01(inputs.citiesQuoted / TOTAL_CITIES);
  const liquidity = 100 * clamp01(inputs.daysWithVolume / inputs.windowDays);
  const stability = 100 * clamp01(1 - inputs.deviationFromHistorical / MAX_DEVIATION_FOR_ZERO_STABILITY);

  return Math.round((freshness + coverage + liquidity + stability) / 4);
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
