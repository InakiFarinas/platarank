export type MaterialCategory = "farm" | "extract" | "artifact" | "meat" | "fish" | "other";

// Closed set derived from every potion recipe (herbs, egg, alcohol, butter, milk) and every meal
// recipe (herbs, egg, milk, butter, plus crops/produce/bread) in ao-bin-dumps items.json, base and
// all enchantment levels. Extend if a future item pulls in a new one.
const HERB_PREFIXES = ["AGARIC", "COMFREY", "BURDOCK", "TEASEL", "FOXGLOVE", "MULLEIN", "YARROW"];

const FARM_SUFFIXES = [
  ...HERB_PREFIXES,
  "EGG",
  "ALCOHOL",
  "BUTTER",
  "MILK",
  "CARROT",
  "BEAN",
  "FLOUR",
  "WHEAT",
  "TURNIP",
  "CABBAGE",
  "POTATO",
  "CORN",
  "PUMPKIN",
  "SEAWEED",
  "BREAD",
];

export function classifyMaterial(itemId: string): MaterialCategory {
  if (itemId.includes("_ALCHEMY_EXTRACT_")) return "extract";
  if (itemId.includes("_ALCHEMY_RARE_")) return "artifact";
  // Runic/soul/relic/avalonian materials in gear recipes (e.g. T4_ARTEFACT_2H_...) -- excluded from
  // the crafting-fee material count the same way alchemy's rare tonics are (see station-fee.ts).
  if (itemId.includes("_ARTEFACT_")) return "artifact";
  // A base mount consumed by a mount recipe (e.g. T5_MOUNT_HORSE inside the armored horse) never
  // gets RRR and doesn't count toward the fee, same engine rule as artifacts.
  if (itemId.includes("_MOUNT_")) return "artifact";
  // Tomes of Insight (Bolsa de visión's skill-book material) never get RRR either -- same engine
  // rule as runic/soul/relic/avalonian materials, confirmed by the user 2026-09-23.
  if (itemId.includes("_SKILLBOOK_")) return "artifact";
  // Fish sauce is cocina's enrichment ingredient for enchanted meals -- same role as arcane
  // extract for potions, so it gets the same treatment (excluded from the fee, not "farm").
  if (itemId.includes("_FISHSAUCE_")) return "extract";
  if (itemId.includes("_MEAT")) return "meat";
  if (itemId.includes("_FISH")) return "fish";
  const resource = itemId.replace(/^T\d+_/, "");
  if (FARM_SUFFIXES.includes(resource)) return "farm";
  return "other";
}

/** Tier encoded in the item id prefix (e.g. "T5_MEAT" -> 5), used for the fish fee factor. */
export function resourceTier(itemId: string): number | null {
  const match = itemId.match(/^T(\d+)_/);
  return match ? Number(match[1]) : null;
}
