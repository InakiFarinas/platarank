import { craftingStationFeePerBatch, farmStationFeePerBatch, refiningStationFeePerBatch } from "@/lib/formulas/station-fee";
import { netSellMultiplier } from "@/lib/formulas/market-tax";
import { returnRate } from "@/lib/formulas/return-rate";
import { robustStat, type CityQuote } from "@/lib/formulas/outliers";
import { computeQualityScore } from "@/lib/formulas/quality-score";
import { getCitySpecialty } from "@/lib/city-specialties";
import { BASE_QUALITY_WEIGHTS } from "@/lib/quality-mechanics";
import { BLACK_MARKET, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import type { Recipe, RecipeMaterial } from "@/lib/db/schema";

const WINDOW_DAYS = 30;

export type CityPricePoint = {
  city: string;
  quality: number;
  price: number | null;
  priceAgeSeconds: number | null;
  avgDailyVolume30d: number;
  daysWithVolume30d: number;
  weightedAvgPrice30d: number | null;
};

/** item -> its per-city (and, for gear, per-quality) price points, precomputed by the ingester. */
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
  /** Where the player crafts. Drives the city-specialty bonus generically for every station type
   * via each recipe's own craftingCategory (potion -> Brecilien, wood -> Fort Sterling, sword ->
   * Thetford, etc. -- see src/lib/city-specialties.ts, parsed from craftingmodifiers.xml). */
  craftCity: Location;
  /** Gear only (Q1..Q5). Defaults to the base CraftingQualityChances weights; the real function
   * that shifts these with focus/food/Destiny Board isn't published, so this is the player's own
   * observed-rates override, not a promise. */
  qualityWeights: readonly number[];
  /** Rows whose sell reference is older than this are still shown but flagged; filtering happens in the UI layer. */
};

export const DEFAULT_PARAMS: RecipeMathParams = {
  buyCities: [...REAL_CITIES],
  sellCities: [...REAL_CITIES, BLACK_MARKET],
  marketShare: 1,
  focus: false,
  stationRatePer100Nutrition: 235,
  craftCity: "Brecilien",
  qualityWeights: BASE_QUALITY_WEIGHTS,
};

export type MaterialLine = RecipeMaterial & {
  buyRefPrice: number | null;
  effectiveCount: number;
  costContribution: number | null;
};

export type QualityBreakdownEntry = {
  quality: number;
  weight: number;
  price: number | null;
  citiesCount: number;
  avgDailyVolume30d: number;
  liquid: boolean;
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
  specialtyActive: boolean;
  specialtyCity: string | null;
  marketSharePct: number;
  feePerBatch: number;
  feePerUnit: number;
  materials: MaterialLine[];
  costPerUnit: number | null;
  revenuePerUnitNet: number | null;
  profitPerUnit: number | null;
  marginPct: number | null;
  platinumPerDay: number | null;
  /** Gear only: per-quality price/liquidity, for the row detail's transparency requirement. */
  qualityBreakdown: QualityBreakdownEntry[] | null;
};

export function computeRecipeRow(recipe: Recipe, market: MarketData, params: RecipeMathParams): RecipeRow {
  const isRefining = recipe.stationType === "refining";
  const isGear = recipe.stationType === "gear";

  const spec = getCitySpecialty(recipe.craftingCategory);
  const specialtyActive = spec !== null && spec.city === params.craftCity;
  const returnRatePct = returnRate({
    cityCraftingSpecialty: specialtyActive && spec!.kind === "crafting",
    cityRefiningSpecialty: specialtyActive && spec!.kind === "refining",
    focus: params.focus,
  });

  const sellSide = isGear
    ? computeGearSellSide(recipe.itemId, market, params)
    : computeSingleQualitySellSide(recipe.itemId, market, params);

  const materials: MaterialLine[] = recipe.materials.map((m) => {
    const points = (market.get(m.itemId) ?? []).filter(
      (p) => p.quality === 1 && params.buyCities.includes(p.city as Location) && p.price !== null,
    );
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

  const totalMaterialUnits = recipe.materials.reduce((sum, m) => sum + m.count, 0);
  const feePerBatch = isGear
    ? craftingStationFeePerBatch(totalMaterialUnits, recipe.tier, recipe.enchant, params.stationRatePer100Nutrition)
    : isRefining
      ? refiningStationFeePerBatch(recipe.tier, recipe.enchant, params.stationRatePer100Nutrition)
      : farmStationFeePerBatch(recipe.materials, params.stationRatePer100Nutrition);
  const feePerUnit = feePerBatch / recipe.batchSize;

  const allMaterialsPriced = materials.every((m) => m.costContribution !== null);
  const materialCostPerBatch = allMaterialsPriced ? materials.reduce((sum, m) => sum + (m.costContribution ?? 0), 0) : null;
  const costPerUnit = materialCostPerBatch !== null ? materialCostPerBatch / recipe.batchSize + feePerUnit : null;

  const revenuePerUnitNet = sellSide.sellRefPriceGross !== null ? sellSide.sellRefPriceGross * netSellMultiplier() : null;
  const profitPerUnit = revenuePerUnitNet !== null && costPerUnit !== null ? revenuePerUnitNet - costPerUnit : null;
  const marginPct = profitPerUnit !== null && costPerUnit !== null && costPerUnit > 0 ? profitPerUnit / costPerUnit : null;
  const platinumPerDay = profitPerUnit !== null ? profitPerUnit * sellSide.avgDailyVolume30d * params.marketShare : null;

  return {
    recipe,
    hasData: sellSide.sellRefPriceGross !== null && allMaterialsPriced,
    sellRefPrice: sellSide.sellRefPriceGross,
    sellRefAgeSeconds: sellSide.oldestAgeSeconds,
    sellRefCitiesCount: sellSide.citiesCount,
    qualityScore: sellSide.qualityScore,
    brecilienCovered: sellSide.brecilienCovered,
    avgDailyVolume30d: sellSide.avgDailyVolume30d,
    discarded: sellSide.discarded,
    returnRatePct,
    focus: params.focus,
    specialtyActive,
    specialtyCity: spec?.city ?? null,
    marketSharePct: params.marketShare,
    feePerBatch,
    feePerUnit,
    materials,
    costPerUnit,
    revenuePerUnitNet,
    profitPerUnit,
    marginPct,
    platinumPerDay,
    qualityBreakdown: sellSide.qualityBreakdown,
  };
}

type SellSide = {
  sellRefPriceGross: number | null;
  oldestAgeSeconds: number | null;
  citiesCount: number;
  avgDailyVolume30d: number;
  qualityScore: number;
  brecilienCovered: boolean;
  discarded: { city: string; price: number; reason: string }[];
  qualityBreakdown: QualityBreakdownEntry[] | null;
};

/** Alquimia, refinado, cocina: everything trades at quality 1, so this is the whole story. */
function computeSingleQualitySellSide(itemId: string, market: MarketData, params: RecipeMathParams): SellSide {
  const points = (market.get(itemId) ?? []).filter((p) => p.quality === 1 && params.sellCities.includes(p.city as Location));
  const quotes: CityQuote[] = points.filter((p) => p.price !== null).map((p) => ({ city: p.city, price: p.price! }));
  const stat = robustStat(quotes, "median");

  const oldestAgeSeconds = oldestAge(points, stat.result.kept.map((q) => q.city));
  const avgDailyVolume30d = points.reduce((sum, p) => sum + p.avgDailyVolume30d, 0);
  const daysWithVolume30d = Math.max(0, ...points.map((p) => p.daysWithVolume30d));
  const historicalWeighted = volumeWeightedAverage(points);
  const deviationFromHistorical =
    stat.value !== null && historicalWeighted !== null ? Math.abs(stat.value - historicalWeighted) / historicalWeighted : 0;

  const qualityScore = computeQualityScore({
    oldestQuoteAgeHours: oldestAgeSeconds !== null ? oldestAgeSeconds / 3600 : 9999,
    citiesQuoted: quotes.length,
    daysWithVolume: daysWithVolume30d,
    windowDays: WINDOW_DAYS,
    deviationFromHistorical,
  });

  return {
    sellRefPriceGross: stat.value,
    oldestAgeSeconds,
    citiesCount: stat.result.kept.length,
    avgDailyVolume30d,
    qualityScore,
    brecilienCovered: points.some((p) => p.city === "Brecilien" && p.price !== null),
    discarded: stat.result.discarded,
    qualityBreakdown: null,
  };
}

/**
 * Armas y armaduras: blend the 5 quality levels by the player's assumed production mix, but gate
 * each quality's price behind its OWN liquidity (avgDailyVolume30d > 0). A parked Q5 listing with
 * zero real trades in 30 days doesn't count -- see brief section 7.4. Illiquid quality mass simply
 * contributes 0 revenue rather than being redistributed: that fraction of output is unsellable at
 * a real price today, which is the honest number, not a smoothed one.
 */
function computeGearSellSide(itemId: string, market: MarketData, params: RecipeMathParams): SellSide {
  const allPoints = market.get(itemId) ?? [];
  const breakdown: QualityBreakdownEntry[] = [];
  let sellRefPriceGross = 0;
  let anyPriced = false;
  let avgDailyVolume30d = 0;

  for (let quality = 1; quality <= 5; quality++) {
    const points = allPoints.filter((p) => p.quality === quality && params.sellCities.includes(p.city as Location));
    const quotes: CityQuote[] = points.filter((p) => p.price !== null).map((p) => ({ city: p.city, price: p.price! }));
    const stat = robustStat(quotes, "median");
    const volume = points.reduce((sum, p) => sum + p.avgDailyVolume30d, 0);
    const liquid = volume > 0 && stat.value !== null;
    const weight = params.qualityWeights[quality - 1] ?? 0;

    breakdown.push({ quality, weight, price: stat.value, citiesCount: stat.result.kept.length, avgDailyVolume30d: volume, liquid });

    if (liquid) {
      sellRefPriceGross += weight * stat.value!;
      avgDailyVolume30d += volume;
      anyPriced = true;
    }
  }

  // Quality score is driven by Q1 (the bulk of any real crafter's output) since that's the
  // liquidity/coverage/freshness a ranking decision actually rests on.
  const q1Points = allPoints.filter((p) => p.quality === 1 && params.sellCities.includes(p.city as Location));
  const q1Quotes: CityQuote[] = q1Points.filter((p) => p.price !== null).map((p) => ({ city: p.city, price: p.price! }));
  const q1Stat = robustStat(q1Quotes, "median");
  const oldestAgeSeconds = oldestAge(q1Points, q1Stat.result.kept.map((q) => q.city));
  const daysWithVolume30d = Math.max(0, ...q1Points.map((p) => p.daysWithVolume30d));
  const historicalWeighted = volumeWeightedAverage(q1Points);
  const deviationFromHistorical =
    q1Stat.value !== null && historicalWeighted !== null ? Math.abs(q1Stat.value - historicalWeighted) / historicalWeighted : 0;

  const qualityScore = computeQualityScore({
    oldestQuoteAgeHours: oldestAgeSeconds !== null ? oldestAgeSeconds / 3600 : 9999,
    citiesQuoted: q1Quotes.length,
    daysWithVolume: daysWithVolume30d,
    windowDays: WINDOW_DAYS,
    deviationFromHistorical,
  });

  return {
    sellRefPriceGross: anyPriced ? sellRefPriceGross : null,
    oldestAgeSeconds,
    citiesCount: q1Stat.result.kept.length,
    avgDailyVolume30d,
    qualityScore,
    brecilienCovered: q1Points.some((p) => p.city === "Brecilien" && p.price !== null),
    discarded: q1Stat.result.discarded,
    qualityBreakdown: breakdown,
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
