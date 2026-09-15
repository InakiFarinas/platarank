import { alchemyStationFeePerBatch } from "@/lib/formulas/station-fee";
import { netSellMultiplier } from "@/lib/formulas/market-tax";
import { returnRate } from "@/lib/formulas/return-rate";
import type { Recipe, RecipeMaterial } from "@/lib/db/schema";

// Fase 1 fixed assumptions (Fase 2 makes each of these a control): craft at Brecilien, the only
// city with an alchemy specialty, without focus; a cheap-but-real station fee rate; buy every
// material at the cheapest available city; sell 100% of the assumed daily volume.
export const FASE1_STATION_RATE_PER_100_NUTRITION = 235;
export const FASE1_MARKET_SHARE = 1;
const FASE1_RETURN_RATE = returnRate({ cityCraftingSpecialty: true, cityRefiningSpecialty: false, focus: false });

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
  discarded: { city: string; field: string; price: number; reason: string }[];
  returnRatePct: number;
  feePerBatch: number;
  feePerUnit: number;
  materials: MaterialLine[];
  costPerUnit: number | null;
  revenuePerUnitNet: number | null;
  profitPerUnit: number | null;
  marginPct: number | null;
  platinumPerDay: number | null;
};

export type AggregateLookup = Map<
  string,
  {
    sellRefPrice: number | null;
    sellRefAgeSeconds: number | null;
    sellRefCitiesCount: number;
    buyRefPrice: number | null;
    avgDailyVolume30d: number;
    qualityScore: number;
    brecilienCovered: boolean;
    discarded: { city: string; field: string; price: number; reason: string }[];
  }
>;

export function computeRecipeRow(recipe: Recipe, aggregates: AggregateLookup): RecipeRow {
  const own = aggregates.get(recipe.itemId);

  const materials: MaterialLine[] = recipe.materials.map((m) => {
    const agg = aggregates.get(m.itemId);
    const buyRefPrice = agg?.buyRefPrice ?? null;
    const effectiveCount = m.count * (1 - FASE1_RETURN_RATE);
    return {
      ...m,
      buyRefPrice,
      effectiveCount,
      costContribution: buyRefPrice !== null ? buyRefPrice * effectiveCount : null,
    };
  });

  const feePerBatch = alchemyStationFeePerBatch(recipe.materials, FASE1_STATION_RATE_PER_100_NUTRITION);
  const feePerUnit = feePerBatch / recipe.batchSize;

  const allMaterialsPriced = materials.every((m) => m.costContribution !== null);
  const materialCostPerBatch = allMaterialsPriced
    ? materials.reduce((sum, m) => sum + (m.costContribution ?? 0), 0)
    : null;
  const costPerUnit = materialCostPerBatch !== null ? materialCostPerBatch / recipe.batchSize + feePerUnit : null;

  const revenuePerUnitNet =
    own?.sellRefPrice != null ? own.sellRefPrice * netSellMultiplier() : null;

  const profitPerUnit =
    revenuePerUnitNet !== null && costPerUnit !== null ? revenuePerUnitNet - costPerUnit : null;

  const marginPct =
    profitPerUnit !== null && costPerUnit !== null && costPerUnit > 0 ? profitPerUnit / costPerUnit : null;

  const avgDailyVolume30d = own?.avgDailyVolume30d ?? 0;
  const platinumPerDay = profitPerUnit !== null ? profitPerUnit * avgDailyVolume30d * FASE1_MARKET_SHARE : null;

  return {
    recipe,
    hasData: own?.sellRefPrice != null && allMaterialsPriced,
    sellRefPrice: own?.sellRefPrice ?? null,
    sellRefAgeSeconds: own?.sellRefAgeSeconds ?? null,
    sellRefCitiesCount: own?.sellRefCitiesCount ?? 0,
    qualityScore: own?.qualityScore ?? 0,
    brecilienCovered: own?.brecilienCovered ?? false,
    avgDailyVolume30d,
    discarded: own?.discarded ?? [],
    returnRatePct: FASE1_RETURN_RATE,
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
