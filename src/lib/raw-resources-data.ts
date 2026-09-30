import rawResourcesJson from "@/data/generated/raw-resources.json";

/** Ungathered raw materials (fiber/hide/ore/rock/wood, T2-T8) -- no recipe produces them, they
 * come straight from the game's resource-node data (see scripts/fetch-game-data.ts). Same shape
 * as a recipe's own name fields, so `itemName()` (item-names.ts) works on these unchanged. */
export type RawResource = { itemId: string; tier: number; category: string; nameEs: string; nameEn: string; namePt?: string };

export const RAW_RESOURCES: readonly RawResource[] = rawResourcesJson as RawResource[];
