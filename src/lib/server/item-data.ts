import { cache } from "react";
import { computeRecipeRow, DEFAULT_PARAMS, type RecipeRow } from "@/lib/recipe-math";
import { recipeById } from "@/lib/recipes-data";
import { loadItemMarketShared } from "@/lib/server/shared-cache";

/** One recipe with default-assumption math, reading only its own and its materials' aggregates
 * (shared across locales through the data cache). */
export const loadItemRow = cache(async (itemId: string): Promise<RecipeRow | null> => {
  const recipe = recipeById(itemId);
  if (!recipe) return null;
  const market = new Map(Object.entries(await loadItemMarketShared(itemId)));
  return computeRecipeRow(recipe, market, DEFAULT_PARAMS);
});
