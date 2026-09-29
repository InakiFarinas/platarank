import hideoutData from "@/data/generated/hideout-bonuses.json";
import { getCitySpecialty } from "@/lib/city-specialties";
import { BASE_STATION_BONUS, CITY_CRAFTING_SPECIALTY_BONUS, CITY_REFINING_SPECIALTY_BONUS, FOCUS_BONUS } from "@/lib/formulas/return-rate";

// Where the player crafts, beyond the royal cities: a guild Hideout. Every number comes
// from the game dump (scripts/fetch-hideout-data.ts, which documents the sources):
// - Hideout, crafting: Power Level's generalist bonus on everything, plus -- on the Hideout's
//   specialties -- the zone quality's bonus and Power Level's specialist bonus. No 18% base.
// - Hideout, refining: a flat bonus (15% black zone, 10% Roads + 10% on the road's resource); Power
//   Level doesn't touch refining.

export const BIOMES = ["SWAMP", "FOREST", "STEPPE", "HIGHLAND", "MOUNTAIN"] as const;
export type Biome = (typeof BIOMES)[number];

/** `zone` 1-6 is the black zone quality (Q1-Q6); 0 is a Roads of Avalon hideout, whose specialties
 * vary road by road, so the player says whether the item is one (`roadSpecialty`). */
export type HideoutSite = { kind: "hideout"; zone: number; biome: Biome; power: number; roadSpecialty?: boolean };
export type CraftSite = { kind: "city" } | HideoutSite;

type HideoutData = {
  powerLevels: { level: number; generalist: number; specialist: number }[];
  outlands: { refining: number; zoneBonus: Record<string, number>; specialties: Record<Biome, string[]> };
  roads: { refining: number; resourceSpecialty: number; craftingSpecialty: number };
};
const data = hideoutData as HideoutData;

export const MAX_POWER_LEVEL = data.powerLevels.length;
export const DEFAULT_HIDEOUT: HideoutSite = { kind: "hideout", zone: 6, biome: "SWAMP", power: 5 };

/** Categories a black zone biome specializes in (the same five as its royal city). */
export function biomeSpecialties(biome: Biome): readonly string[] {
  return data.outlands.specialties[biome] ?? [];
}

export type SiteBonus = {
  /** Production bonus before focus. */
  bonus: number;
  /** True when a location specialty applies (city specialty, hideout biome or road specialty). */
  specialty: boolean;
  /** City specialty kind when crafting in the royal city that has it. */
  cityKind?: "crafting" | "refining";
};

/** Production bonus of crafting this recipe at this site, focus excluded. `craftCity` only matters
 * for a royal city. */
export function siteBonus(rawSite: CraftSite | undefined, recipe: { stationType: string; craftingCategory: string | null }, craftCity: string): SiteBonus {
  // Saved plans are user-written JSON (and re-priced by the ingest's alerts): an out-of-range
  // hideout reads as a city rather than breaking the calculation.
  const site = rawSite?.kind === "hideout" ? (parseHideout(rawSite) ?? undefined) : undefined;
  const refining = recipe.stationType === "refining";
  if (!site) {
    const spec = getCitySpecialty(recipe.craftingCategory);
    const active = spec !== null && spec.city === craftCity && (spec.kind === "crafting" || spec.kind === "refining");
    if (!active) return { bonus: BASE_STATION_BONUS, specialty: false };
    const kind = spec!.kind as "crafting" | "refining";
    return { bonus: BASE_STATION_BONUS + (kind === "refining" ? CITY_REFINING_SPECIALTY_BONUS : CITY_CRAFTING_SPECIALTY_BONUS), specialty: true, cityKind: kind };
  }
  const road = site.zone === 0;
  if (refining) {
    if (!road) return { bonus: data.outlands.refining, specialty: false };
    const specialty = site.roadSpecialty === true;
    return { bonus: data.roads.refining + (specialty ? data.roads.resourceSpecialty : 0), specialty };
  }
  const power = data.powerLevels[Math.min(MAX_POWER_LEVEL, Math.max(1, Math.round(site.power))) - 1];
  const specialty = road ? site.roadSpecialty === true : recipe.craftingCategory !== null && biomeSpecialties(site.biome).includes(recipe.craftingCategory);
  const zoneBonus = road ? data.roads.craftingSpecialty : (data.outlands.zoneBonus[String(site.zone)] ?? 0);
  return { bonus: power.generalist + (specialty ? zoneBonus + power.specialist : 0), specialty };
}

/** Resource return rate: 1 - 1 / (1 + bonus), focus adding its flat +59%. */
export function siteReturnRate(bonus: number, focus: boolean): number {
  return 1 - 1 / (1 + bonus + (focus ? FOCUS_BONUS : 0));
}

/** A hideout from untrusted input (a shared link, an old plan), clamped to valid values. */
export function parseHideout(raw: unknown): HideoutSite | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const zone = Number(r.zone);
  const power = Number(r.power);
  if (!Number.isInteger(zone) || zone < 0 || zone > 6) return null;
  if (!Number.isInteger(power) || power < 1 || power > MAX_POWER_LEVEL) return null;
  const biome = (BIOMES as readonly string[]).includes(r.biome as string) ? (r.biome as Biome) : DEFAULT_HIDEOUT.biome;
  return { kind: "hideout", zone, biome, power, ...(r.roadSpecialty === true ? { roadSpecialty: true } : {}) };
}
