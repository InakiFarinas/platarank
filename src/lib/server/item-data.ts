import { cache } from "react";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { marketAggregates, recipes as recipesTable } from "@/lib/db/schema";
import { computeRecipeRow, DEFAULT_PARAMS, type CityPricePoint, type RecipeRow } from "@/lib/recipe-math";
import { recipeJournal } from "@/lib/journals";

/** One recipe with default-assumption math, reading only its own and its materials' aggregates. */
export const loadItemRow = cache(async (itemId: string): Promise<RecipeRow | null> => {
  const [recipe] = await db.select().from(recipesTable).where(eq(recipesTable.itemId, itemId));
  if (!recipe) return null;
  const journal = recipeJournal(recipe);
  const ids = [recipe.itemId, ...recipe.materials.map((m) => m.itemId)];
  if (journal) ids.push(journal.emptyItemId, journal.fullItemId);
  const rows = await db.select().from(marketAggregates).where(inArray(marketAggregates.itemId, ids));
  const market = new Map<string, CityPricePoint[]>();
  for (const a of rows) {
    const list = market.get(a.itemId) ?? [];
    list.push({
      city: a.city,
      quality: a.quality,
      price: a.price != null ? Number(a.price) : null,
      priceAgeSeconds: a.priceAgeSeconds,
      buyPriceMax: a.buyPriceMax != null ? Number(a.buyPriceMax) : null,
      avgDailyVolume30d: Number(a.avgDailyVolume30d),
      daysWithVolume30d: a.daysWithVolume30d,
      weightedAvgPrice30d: a.weightedAvgPrice30d != null ? Number(a.weightedAvgPrice30d) : null,
    });
    market.set(a.itemId, list);
  }
  return computeRecipeRow(recipe, market, DEFAULT_PARAMS);
});
