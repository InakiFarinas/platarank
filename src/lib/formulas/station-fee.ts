import type { RecipeMaterial } from "@/lib/db/schema";

// Usage fee: plata por cada 100 de nutricion consumida, fijada por el dueno de la estacion.
// Alquimia y cocina: (tarifa/1000) x (45 x materiales_de_granja + 72 x energia_avaloniana + factor_pescado)
// Fee por LOTE (batch), no por unidad. No depende de tier ni encantamiento -- solo de la cantidad
// de materiales de granja en la receta. Artefactos y extractos arcanos no pagan fee.
// Source: post oficial de Usage Fee (Lands Awakened) + "Explaining Crafting Tax" (TheEvilEnderman),
// ver /metodologia.
const FARM_MATERIAL_UNIT = 45;

export function alchemyStationFeePerBatch(
  materials: Pick<RecipeMaterial, "category" | "count">[],
  ratePer100Nutrition: number,
): number {
  const farmMaterialCount = materials
    .filter((m) => m.category === "farm")
    .reduce((sum, m) => sum + m.count, 0);
  // Avalonian energy and fish don't appear in any alchemy recipe today, so their terms are
  // omitted here; they belong to the cocina/refinado formulas added in Fase 3.
  const nutritionUnits = FARM_MATERIAL_UNIT * farmMaterialCount;
  return (ratePer100Nutrition / 1000) * nutritionUnits;
}

// Refinado: (tarifa/1000) x 18 x 2^(tier-4) x 2^ench. Unlike alchemy, this depends only on the
// output's tier and enchantment level -- not on the materials in the recipe.
export function refiningStationFeePerBatch(tier: number, enchant: number, ratePer100Nutrition: number): number {
  return (ratePer100Nutrition / 1000) * 18 * 2 ** (tier - 4) * 2 ** enchant;
}
