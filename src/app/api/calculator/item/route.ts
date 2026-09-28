import { NextResponse, type NextRequest } from "next/server";
import { recipeById, recipeVariants } from "@/lib/recipes-data";
import { loadItemMarketShared } from "@/lib/server/shared-cache";

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" };

/** One recipe + the market points for it and its materials + its sibling tier/enchant variants. */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Recipes come from the bundled game data; only prices touch the database, through the shared
  // hourly cache the recipe pages use too (mount breeding extras and gear journals included).
  const recipe = recipeById(id);
  if (!recipe) return NextResponse.json({ error: "not found" }, { status: 404 });
  const market = await loadItemMarketShared(recipe.itemId);
  // Prices refresh hourly: let the CDN/browser absorb repeat lookups too.
  return NextResponse.json(
    { recipe, market, variants: recipeVariants(recipe.baseItemId).sort((a, b) => a.tier - b.tier || a.enchant - b.enchant).map(({ itemId, tier, enchant }) => ({ itemId, tier, enchant })) },
    { headers: CACHE_HEADERS },
  );
}
