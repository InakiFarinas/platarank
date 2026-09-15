import citySpecialtiesData from "@/data/generated/city-specialties.json";

// "meat" entries (meat_pig, meat_goose, ...) come straight out of craftingmodifiers.xml too, but
// no recipe generated today (alquimia/refinado/cocina/gear) has a craftingCategory that matches
// one -- cocina's own category is "food" (kind "crafting"), a separate entry. They're parsed for
// completeness in case a future station type needs them, not currently consulted by anything.
export type CitySpecialty = { category: string; city: string; kind: "crafting" | "refining" | "meat"; bonus: number };

const BY_CATEGORY = new Map<string, CitySpecialty>(
  (citySpecialtiesData as CitySpecialty[]).map((s) => [s.category, s]),
);

/**
 * Every recipe's craftingCategory maps to at most one city+bonus type, parsed straight from
 * craftingmodifiers.xml (see scripts/fetch-game-data.ts). Categories with no entry (e.g. faction
 * capes with no craftingcategory at all) correctly get no specialty bonus, ever.
 */
export function getCitySpecialty(craftingCategory: string | null): CitySpecialty | null {
  if (!craftingCategory) return null;
  return BY_CATEGORY.get(craftingCategory) ?? null;
}
