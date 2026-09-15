import { alchemyStationFeePerBatch } from "@/lib/formulas/station-fee";
import { netSellMultiplier } from "@/lib/formulas/market-tax";
import { returnRate } from "@/lib/formulas/return-rate";
import { robustStat, type CityQuote } from "@/lib/formulas/outliers";
import { computeQualityScore } from "@/lib/formulas/quality-score";
import { BLACK_MARKET, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import type { Recipe, RecipeMaterial } from "@/lib/db/schema";

const WINDOW_DAYS = 30;

export type CityPricePoint = {
  city: string;
  price: number | null;
  priceAgeSeconds: number | null;
  avgDailyVolume30d: number;
  daysWithVolume30d: number;
  weightedAvgPrice30d: number | null;
};

/** item -> its per-city price points, exactly as precomputed by the ingester. */
export type MarketData = Map<string, CityPricePoint[]>;

export type RecipeMathParams = {
  /** Cities where the player is willing to buy materials (Black Market excluded: no sell orders there). */
  buyCities: Location[];
  /** Cities where the player is willing to sell the crafted item, Black Market included as an option. */
  sellCities: Location[];
  /** 0-1. Fraction of the market's daily volume the player assumes they can capture. */
  marketShare: number;
  focus: boolean;
  stationRatePer100Nutrition: number;
  /** Rows whose sell reference is older than this are still shown but flagged; filtering happens in the UI layer. */
};

export const DEFAULT_PARAMS: RecipeMathParams = {
  buyCities: [...REAL_CITIES],
  sellCities: [...REAL_CITIES, BLACK_MARKET],
  marketShare: 1,
  focus: false,
  stationRatePer100Nutrition: 235,
};

export type MaterialLine = RecipeMaterial & {
  buyRefPrice: number | null;
  effectiveCount: number;
  costContribution: number | null;
};

export type RecipeRow = {
  recipe: Recipe;
  hasData: boolean;
  sellRefPrice: number | null;
  sellRefAgeSeconds: number | null;
  sellRefCitiesCount: number;
  qualityScore: number;
  brecilienCovered: boolean;
  avgDailyVolume30d: number;
  discarded: { city: string; price: number; reason: string }[];
  returnRatePct: number;
  focus: boolean;
  marketSharePct: number;
  feePerBatch: number;
  feePerUnit: number;
  materials: MaterialLine[];
  costPerUnit: number | null;
  revenuePerUnitNet: number | null;
  profitPerUnit: number | null;
  marginPct: number | null;
  platinumPerDay: number | null;
};

export function computeRecipeRow(recipe: Recipe, market: MarketData, params: RecipeMathParams): RecipeRow {
  const ownPoints = (market.get(recipe.itemId) ?? []).filter((p) => params.sellCities.includes(p.city as Location));

  const sellQuotes: CityQuote[] = ownPoints.filter((p) => p.price !== null).map((p) => ({ city: p.city, price: p.price! }));
  const sellStat = robustStat(sellQuotes, "median");

  const oldestSellAgeSeconds = oldestAge(ownPoints, sellStat.result.kept.map((q) => q.city));
  const avgDailyVolume30d = ownPoints.reduce((sum, p) => sum + p.avgDailyVolume30d, 0);
  const daysWithVolume30d = Math.max(0, ...ownPoints.map((p) => p.daysWithVolume30d));
  const historicalWeighted = volumeWeightedAverage(ownPoints);
  const deviationFromHistorical =
    sellStat.value !== null && historicalWeighted !== null ? Math.abs(sellStat.value - historicalWeighted) / historicalWeighted : 0;

  const qualityScore = computeQualityScore({
    oldestQuoteAgeHours: oldestSellAgeSeconds !== null ? oldestSellAgeSeconds / 3600 : 9999,
    citiesQuoted: sellQuotes.length,
    daysWithVolume: daysWithVolume30d,
    windowDays: WINDOW_DAYS,
    deviationFromHistorical,
  });

  const returnRatePct = returnRate({ cityCraftingSpecialty: true, cityRefiningSpecialty: false, focus: params.focus });

  const materials: MaterialLine[] = recipe.materials.map((m) => {
    const points = (market.get(m.itemId) ?? []).filter((p) => params.buyCities.includes(p.city as Location) && p.price !== null);
    const buyQuotes: CityQuote[] = points.map((p) => ({ city: p.city, price: p.price! }));
    const buyStat = robustStat(buyQuotes, "min");
    const effectiveCount = m.count * (1 - returnRatePct);
    return {
      ...m,
      buyRefPrice: buyStat.value,
      effectiveCount,
      costContribution: buyStat.value !== null ? buyStat.value * effectiveCount : null,
    };
  });

  const feePerBatch = alchemyStationFeePerBatch(recipe.materials, params.stationRatePer100Nutrition);
  const feePerUnit = feePerBatch / recipe.batchSize;

  const allMaterialsPriced = materials.every((m) => m.costContribution !== null);
  const materialCostPerBatch = allMaterialsPriced ? materials.reduce((sum, m) => sum + (m.costContribution ?? 0), 0) : null;
  const costPerUnit = materialCostPerBatch !== null ? materialCostPerBatch / recipe.batchSize + feePerUnit : null;

  const revenuePerUnitNet = sellStat.value !== null ? sellStat.value * netSellMultiplier() : null;
  const profitPerUnit = revenuePerUnitNet !== null && costPerUnit !== null ? revenuePerUnitNet - costPerUnit : null;
  const marginPct = profitPerUnit !== null && costPerUnit !== null && costPerUnit > 0 ? profitPerUnit / costPerUnit : null;
  const platinumPerDay = profitPerUnit !== null ? profitPerUnit * avgDailyVolume30d * params.marketShare : null;

  return {
    recipe,
    hasData: sellStat.value !== null && allMaterialsPriced,
    sellRefPrice: sellStat.value,
    sellRefAgeSeconds: oldestSellAgeSeconds,
    sellRefCitiesCount: sellStat.result.kept.length,
    qualityScore,
    brecilienCovered: ownPoints.some((p) => p.city === "Brecilien" && p.price !== null),
    avgDailyVolume30d,
    discarded: sellStat.result.discarded,
    returnRatePct,
    focus: params.focus,
    marketSharePct: params.marketShare,
    feePerBatch,
    feePerUnit,
    materials,
    costPerUnit,
    revenuePerUnitNet,
    profitPerUnit,
    marginPct,
    platinumPerDay,
  };
}

function oldestAge(points: CityPricePoint[], cities: string[]): number | null {
  const ages = points.filter((p) => cities.includes(p.city) && p.priceAgeSeconds !== null).map((p) => p.priceAgeSeconds!);
  return ages.length > 0 ? Math.max(...ages) : null;
}

function volumeWeightedAverage(points: CityPricePoint[]): number | null {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const p of points) {
    if (p.weightedAvgPrice30d === null) continue;
    weightedSum += p.weightedAvgPrice30d * p.avgDailyVolume30d;
    weightTotal += p.avgDailyVolume30d;
  }
  return weightTotal > 0 ? weightedSum / weightTotal : null;
}
