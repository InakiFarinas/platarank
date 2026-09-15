export type MaterialCategory = "farm" | "extract" | "artifact" | "other";

// Closed set derived from every potion recipe in ao-bin-dumps items.json (base + all
// enchantment levels): herbs, egg, alcohol, butter and milk are the only "material de granja"
// categories that show up in alchemy. Extend the herb list if a future item pulls in a new one.
const HERB_PREFIXES = [
  "AGARIC",
  "COMFREY",
  "BURDOCK",
  "TEASEL",
  "FOXGLOVE",
  "MULLEIN",
  "YARROW",
];

const FARM_SUFFIXES = [...HERB_PREFIXES, "EGG", "ALCOHOL", "BUTTER", "MILK"];

export function classifyMaterial(itemId: string): MaterialCategory {
  if (itemId.includes("_ALCHEMY_EXTRACT_")) return "extract";
  if (itemId.includes("_ALCHEMY_RARE_")) return "artifact";
  const resource = itemId.replace(/^T\d+_/, "");
  if (FARM_SUFFIXES.includes(resource)) return "farm";
  return "other";
}
