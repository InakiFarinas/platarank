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

// Crafteo normal (forja, arco, torre, herramientas -- armas y armaduras en este proyecto):
// (tarifa/1000) x 18 x cant_materiales x (1 + 0.25*(2^tier_artefacto-1)/2^ench) x 2^(tier-4) x 2^ench
// "cant_materiales" se toma como la suma de unidades consumidas (mismo criterio que la formula de
// alquimia), no la cantidad de lineas de material -- sin un caso de oro que lo confirme, es un
// supuesto a verificar.
// tier_artefacto (plano=0, runico=1, alma=2, reliquia=3, avaloniano=4) depende de que artefacto
// especifico exige la receta directa. Las lineas de equipo estandar (T4-T8 normal) no consumen
// ningun artefacto en su craft directo -- el rango va solo en la mejora opcional por runas/almas/
// reliquias, que es un camino distinto (upgraderequirements), no el que rankeamos. Las lineas
// especiales de faccion/hellgate si consumen un artefacto directo, pero no hay forma de derivar su
// tier de rareza desde el dump sin investigacion adicional -- se asume 0 para todas, y por lo tanto
// el fee de esas lineas especificas puede estar subestimado. Documentado, no oculto.
export function craftingStationFeePerBatch(
  totalMaterialUnits: number,
  tier: number,
  enchant: number,
  ratePer100Nutrition: number,
  artifactTier = 0,
): number {
  const artifactMultiplier = 1 + (0.25 * (2 ** artifactTier - 1)) / 2 ** enchant;
  return (ratePer100Nutrition / 1000) * 18 * totalMaterialUnits * artifactMultiplier * 2 ** (tier - 4) * 2 ** enchant;
}
