import { NextResponse, type NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { normalize } from "@/lib/recipe-filters";
import { db } from "@/lib/db/client";
import { recipes } from "@/lib/db/schema";

/** Item picker: one hit per base item (tier/enchant variants are switched in the UI). */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json([]);
  const lang = request.nextUrl.searchParams.get("locale");
  const en = lang === "en";
  const pt = lang === "pt";
  // Portuguese names may be missing on rows synced before they existed: fall back to English.
  const namePt = sql`coalesce(${recipes.namePt}, ${recipes.nameEn})`;
  // Accent-insensitive on both sides ("pocion" finds "Poción"); English names have no accents.
  const like = `%${normalize(q).replace(/[%_]/g, "")}%`;
  const fold = (col: unknown) => sql`translate(lower(${col}), 'áéíóúüñãõâêôçà', 'aeiouunaoaeoca')`;
  const rows = await db
    .select({
      itemId: recipes.itemId,
      baseItemId: recipes.baseItemId,
      nameEs: recipes.nameEs,
      nameEn: recipes.nameEn,
      namePt,
      tier: recipes.tier,
      enchant: recipes.enchant,
      stationType: recipes.stationType,
    })
    .from(recipes)
    .where(
      and(
        eq(recipes.enchant, 0),
        // English matches English names only; Spanish keeps matching either name, as before.
        // English matches English names only; Spanish and Portuguese match their own name or English.
        en
          ? sql`${fold(recipes.nameEn)} like ${like}`
          : sql`(${fold(pt ? namePt : recipes.nameEs)} like ${like} or ${fold(recipes.nameEn)} like ${like})`,
      ),
    )
    .orderBy(en ? recipes.nameEn : pt ? namePt : recipes.nameEs, recipes.tier)
    .limit(40);
  // Recipes only change when the game data is regenerated, so this is safe to cache for a long time.
  return NextResponse.json(rows, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
