import { NextResponse, type NextRequest } from "next/server";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { marketAggregates, recipes } from "@/lib/db/schema";
import type { CityPricePoint } from "@/lib/recipe-math";
import { ALL_BREEDING_MARKET_ITEMS } from "@/lib/formulas/breeding";

const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" };

/** One recipe +the market points for it and its materials + its sibling tier/enchant variants. */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const [recipe] = await db.select().from(recipes).where(eq(recipes.itemId, id));
  if (!recipe) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Same item across tiers: "T5_OFF_BOOK" and "T6_OFF_BOOK" share the suffix, not the (tiered) name.
  const tierless = (id: string) => id.replace(/^T[0-9]+_/, "");
  const suffix = tierless(recipe.baseItemId);
  // LIKE `_` is a wildcard, which only over-fetches; the exact match happens in JS below.
  const siblings = (
    await db
      .select({ itemId: recipes.itemId, baseItemId: recipes.baseItemId, tier: recipes.tier, enchant: recipes.enchant })
      .from(recipes)
      .where(like(recipes.baseItemId, `T%_${suffix}`))
  ).filter((v) => tierless(v.baseItemId) === suffix);

  const ids = [recipe.itemId, ...recipe.materials.map((m) => m.itemId)];
  // Monturas: the "criar por tu cuenta" toggle prices feed crops and market-traded babies that
  // aren't a material of the recipe itself (see src/lib/formulas/breeding.ts), so they'd otherwise
  // never be fetched here.
  if (recipe.stationType === "mount") ids.push(...ALL_BREEDING_MARKET_ITEMS);
  const rows = await db.select().from(marketAggregates).where(inArray(marketAggregates.itemId, ids));
  const market: Record<string, CityPricePoint[]> = {};
  for (const a of rows) {
    (market[a.itemId] ??= []).push({
      city: a.city,
      quality: a.quality,
      price: a.price != null ? Number(a.price) : null,
      priceAgeSeconds: a.priceAgeSeconds,
      avgDailyVolume30d: Number(a.avgDailyVolume30d),
      daysWithVolume30d: a.daysWithVolume30d,
      weightedAvgPrice30d: a.weightedAvgPrice30d != null ? Number(a.weightedAvgPrice30d) : null,
    });
  }
  // Prices refresh hourly: let the CDN/browser absorb repeat lookups instead of hitting the DB.
  return NextResponse.json(
    { recipe, market, variants: siblings.map(({ itemId, tier, enchant }) => ({ itemId, tier, enchant })) },
    { headers: CACHE_HEADERS },
  );
}
