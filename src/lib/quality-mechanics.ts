import qualityMechanicsData from "@/data/generated/quality-mechanics.json";

/** Base crafting-quality weights [Q1..Q5], parsed from gamedata.xml's CraftingQualityChances.
 * This is the distribution for a crafter with zero CraftingQuality bonus (no focus, no crafting
 * food, no Destiny Board nodes) -- the server-side function that shifts these weights upward
 * isn't published anywhere we could read, so this is a starting point the user can override with
 * their own observed rates, not a promise of what they'll actually get. */
export const BASE_QUALITY_WEIGHTS: readonly number[] = qualityMechanicsData.craftingQualityWeights;
