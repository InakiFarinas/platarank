// Usage fee: plata por cada 100 de nutricion consumida, fijada por el dueno de la estacion.
// One formula for all four rubros -- the earlier per-station approximations (fixed 45/900/fish-tier
// units for alquimia/cocina, an exponential tier/enchant-only guess for refinado, a totalMaterialUnits
// x artifactMultiplier guess for equipo) are gone, replaced by the real mechanic:
//
//   Nutricion consumida = ItemValue x 0.1125
//   Costo = (Nutricion consumida / 100) x Tax = ItemValue x Tax x 0.001125
//
// ItemValue (IV) is the sum of every non-artifact material's real @itemvalue from the dump (each
// times its recipe count) -- precomputed once at build time into recipe.materialItemValue (see
// fetch-game-data.ts's resolveItemValue), since it never depends on live market data. Artifacts
// never contribute to IV (confirmed in-game), which is also why they're excluded from the crafting-
// normal fee's old material-count term -- that term doesn't exist anymore either, IV replaces it.
// The client rounds the final silver cost, so this does too.
// Source: user-provided derivation, confirmed against the in-game Usage Fee display.
const NUTRITION_PER_ITEM_VALUE = 0.1125;

export function craftingFeePerBatch(materialItemValue: number, ratePer100Nutrition: number): number {
  const nutritionConsumed = materialItemValue * NUTRITION_PER_ITEM_VALUE;
  return Math.round((nutritionConsumed / 100) * ratePer100Nutrition);
}
