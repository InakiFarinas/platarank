import { NextResponse, type NextRequest } from "next/server";
import recipesJson from "@/data/generated/recipes.json";

type Recipe = { itemId: string; nameEs: string; nameEn?: string; tier: number; enchant: number };

// Built once per server instance: itemId -> names, for resolving names saved in a single locale
// (e.g. crafting sessions store the display name at save time).
const BY_ID = new Map((recipesJson as Recipe[]).map((r) => [r.itemId, r]));

export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 100);
  const names: Record<string, { nameEs: string; nameEn: string; tier: number; enchant: number }> = {};
  for (const id of ids) {
    const r = BY_ID.get(id);
    if (r) names[id] = { nameEs: r.nameEs, nameEn: r.nameEn ?? r.nameEs, tier: r.tier, enchant: r.enchant };
  }
  return NextResponse.json(names, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
