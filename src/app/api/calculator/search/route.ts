import { NextResponse, type NextRequest } from "next/server";
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recipes } from "@/lib/db/schema";

/** Item picker: one hit per base item (tier/enchant variants are switched in the UI). */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json([]);
  const like = `%${q.replace(/[%_]/g, "")}%`;
  const rows = await db
    .select({
      itemId: recipes.itemId,
      baseItemId: recipes.baseItemId,
      nameEs: recipes.nameEs,
      tier: recipes.tier,
      enchant: recipes.enchant,
      stationType: recipes.stationType,
    })
    .from(recipes)
    .where(and(eq(recipes.enchant, 0), or(ilike(recipes.nameEs, like), ilike(recipes.nameEn, like))))
    .orderBy(recipes.nameEs, recipes.tier)
    .limit(40);
  return NextResponse.json(rows);
}
