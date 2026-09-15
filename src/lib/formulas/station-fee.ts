import type { RecipeMaterial } from "@/lib/db/schema";
import { resourceTier } from "@/lib/materials/classify";

// Usage fee: plata por cada 100 de nutricion consumida, fijada por el dueno de la estacion.
// Alquimia y cocina comparten esta formula:
// (tarifa/1000) x (45 x materiales_de_granja + 72 x energia_avaloniana + factor_pescado + 900 x animal_de_carne)
// Fee por LOTE (batch), no por unidad. No depende de tier ni encantamiento -- solo de la cantidad
// de cada tipo de material en la receta. Artefactos y extractos arcanos (o su equivalente en
// cocina, el fish sauce) no pagan fee.
// Source: post oficial de Usage Fee (Lands Awakened) + "Explaining Crafting Tax" (TheEvilEnderman),
// ver /metodologia.
const FARM_MATERIAL_UNIT = 45;
const MEAT_UNIT = 900;
const FISH_UNIT_BY_TIER: Record<number, number> = { 3: 11.25, 5: 22.5, 7: 33.75, 8: 225 };

export function farmStationFeePerBatch(
  materials: Pick<RecipeMaterial, "category" | "count" | "itemId">[],
  ratePer100Nutrition: number,
): number {
  let nutritionUnits = 0;
  for (const m of materials) {
    if (m.category === "farm") nutritionUnits += FARM_MATERIAL_UNIT * m.count;
    else if (m.category === "meat") nutritionUnits += MEAT_UNIT * m.count;
    else if (m.category === "fish") {
      const tier = resourceTier(m.itemId);
      nutritionUnits += (tier !== null ? (FISH_UNIT_BY_TIER[tier] ?? 0) : 0) * m.count;
    }
    // Avalonian energy (72/unit per the brief) doesn't appear in any alchemy or cocina recipe
    // today, so it's omitted; add a branch here if a future recipe needs it.
  }
  return (ratePer100Nutrition / 1000) * nutritionUnits;
}

// Refinado: (tarifa/1000) x 18 x 2^(tier-4) x 2^ench. Unlike alchemy/cocina, this depends only on
// the output's tier and enchantment level -- not on the materials in the recipe.
export function refiningStationFeePerBatch(tier: number, enchant: number, ratePer100Nutrition: number): number {
  return (ratePer100Nutrition / 1000) * 18 * 2 ** (tier - 4) * 2 ** enchant;
}
