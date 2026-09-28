import recipesJson from "@/data/generated/recipes.json";
import type { Recipe } from "@/lib/db/schema";

// The recipes the site reads, straight from the generated game data bundled with each deploy. The
// ingester syncs this same file into the `recipes` table every hour, so reading it here gives the
// same rows without the Supabase egress: the gear recipes alone are ~3.9 MB per read (their
// materials JSON), on a 5 GB/month plan. It is also exactly the data this deploy's code was built
// against, which the table can lag behind or run ahead of.
type RecipeJson = Omit<Recipe, "namePt" | "materialItemValue"> & { namePt?: string; materialItemValue: number };

export const RECIPES: readonly Recipe[] = (recipesJson as unknown as RecipeJson[]).map((r) => ({
  ...r,
  namePt: r.namePt ?? null,
  // numeric column in the table, so the rest of the code reads it as a string.
  materialItemValue: String(r.materialItemValue),
}));

const BY_ID = new Map(RECIPES.map((r) => [r.itemId, r]));
const BY_STATION = new Map<string, Recipe[]>();
for (const r of RECIPES) {
  const list = BY_STATION.get(r.stationType);
  if (list) list.push(r);
  else BY_STATION.set(r.stationType, [r]);
}

export function recipeById(itemId: string): Recipe | null {
  return BY_ID.get(itemId) ?? null;
}

export function recipesOfStation(stationType: string): Recipe[] {
  return BY_STATION.get(stationType) ?? [];
}

/** Recipe count per station (home page). */
export function recipeCounts(): Record<string, number> {
  return Object.fromEntries([...BY_STATION].map(([station, list]) => [station, list.length]));
}

const tierless = (id: string) => id.replace(/^T[0-9]+_/, "");

/** The same item across tiers and enchants ("T5_OFF_BOOK" and "T6_OFF_BOOK@2" share the suffix). */
export function recipeVariants(baseItemId: string): Recipe[] {
  const suffix = tierless(baseItemId);
  return RECIPES.filter((r) => tierless(r.baseItemId) === suffix);
}
