import { NextResponse } from "next/server";
import recipesJson from "@/data/generated/recipes.json";
import { toSearchEntry } from "@/lib/item-search";

// Built once at deploy time from the same generated recipes the ingester syncs into the DB, so the
// calculator's search never touches Supabase: the browser downloads this (~19 KB gzipped) once and
// filters locally on every keystroke. Recipes only change when the game data is regenerated, which
// ships as a new deploy anyway.
export const dynamic = "force-static";

type RecipeRow = { itemId: string; nameEs: string; nameEn: string; tier: number; enchant: number; stationType: "alchemy" | "refining" | "cooking" | "gear" | "mount" };

export function GET() {
  const index = (recipesJson as RecipeRow[]).filter((r) => r.enchant === 0).map(toSearchEntry);
  return NextResponse.json(index, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
