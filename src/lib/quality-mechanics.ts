import qualityMechanicsData from "@/data/generated/quality-mechanics.json";

/** Base crafting-quality weights [Q1..Q5], parsed from gamedata.xml's CraftingQualityChances.
 * This is the distribution for a crafter with zero CraftingQuality bonus (no focus, no crafting
 * food, no Destiny Board nodes). The server-side function that shifts these weights upward with
 * focus/food/Destiny Board isn't published anywhere, and the game doesn't surface a player's own
 * real percentages either -- there's no way for a player to fill in a more accurate number than
 * this, so it's used as a fixed platform-wide default rather than a per-player input (an editable
 * override was tried and removed; see PRODUCT.md). */
export const BASE_QUALITY_WEIGHTS: readonly number[] = qualityMechanicsData.craftingQualityWeights;
