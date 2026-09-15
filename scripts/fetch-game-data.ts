// Downloads the two ao-bin-dumps files needed for alchemy recipes (items.json for crafting
// requirements, formatted/items.json for localized names), builds the derived recipes.json,
// and writes it into the repo. Run manually when the game patches; not called at runtime.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { classifyMaterial } from "../src/lib/materials/classify";
import type { RecipeMaterial } from "../src/lib/db/schema";

const ITEMS_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json";
const FORMATTED_ITEMS_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json";
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "generated", "recipes.json");

type RawCraftResource = { "@uniquename": string; "@count": string };
type RawCraftingRequirements = {
  "@amountcrafted": string;
  "@craftingfocus"?: string;
  craftresource?: RawCraftResource | RawCraftResource[];
};
type RawEnchantment = {
  "@enchantmentlevel": string;
  craftingrequirements: RawCraftingRequirements;
};
type RawConsumableItem = {
  "@uniquename": string;
  "@tier": string;
  "@craftingcategory"?: string;
  craftingrequirements?: RawCraftingRequirements;
  enchantments?: { enchantment: RawEnchantment | RawEnchantment[] };
};

type LocalizedItem = {
  UniqueName: string;
  LocalizedNames?: Record<string, string>;
};

type Recipe = {
  itemId: string;
  baseItemId: string;
  nameEs: string;
  nameEn: string;
  tier: number;
  enchant: number;
  stationType: "alchemy";
  batchSize: number;
  craftingFocus: number;
  materials: RecipeMaterial[];
};

async function main() {
  console.log("Downloading ao-bin-dumps...");
  const [itemsRoot, formattedItems] = await Promise.all([
    fetchJson<{ items: { consumableitem: RawConsumableItem[] } }>(ITEMS_URL),
    fetchJson<LocalizedItem[]>(FORMATTED_ITEMS_URL),
  ]);

  const names = new Map<string, { es: string; en: string }>();
  for (const item of formattedItems) {
    if (!item.LocalizedNames) continue;
    names.set(item.UniqueName, {
      es: item.LocalizedNames["ES-ES"] ?? item.UniqueName,
      en: item.LocalizedNames["EN-US"] ?? item.UniqueName,
    });
  }

  const potions = itemsRoot.items.consumableitem.filter(
    (c) => c["@craftingcategory"] === "potion" && c.craftingrequirements,
  );

  const recipes: Recipe[] = [];
  for (const potion of potions) {
    const baseItemId = potion["@uniquename"];
    const tier = Number(potion["@tier"]);

    recipes.push(buildRecipe(baseItemId, baseItemId, tier, 0, potion.craftingrequirements!, names));

    const enchantments = potion.enchantments?.enchantment;
    if (enchantments) {
      for (const ench of asArray(enchantments)) {
        const level = Number(ench["@enchantmentlevel"]);
        const itemId = `${baseItemId}@${level}`;
        recipes.push(buildRecipe(itemId, baseItemId, tier, level, ench.craftingrequirements, names));
      }
    }
  }

  recipes.sort((a, b) => a.itemId.localeCompare(b.itemId));
  await writeFile(OUTPUT_PATH, JSON.stringify(recipes, null, 2) + "\n", "utf8");
  console.log(`Wrote ${recipes.length} recipes to ${OUTPUT_PATH}`);
}

function buildRecipe(
  itemId: string,
  baseItemId: string,
  tier: number,
  enchant: number,
  cr: RawCraftingRequirements,
  names: Map<string, { es: string; en: string }>,
): Recipe {
  const materials = asArray(cr.craftresource ?? []).map((r) => {
    const materialId = r["@uniquename"];
    const materialNames = names.get(materialId);
    return {
      itemId: materialId,
      count: Number(r["@count"]),
      category: classifyMaterial(materialId),
      nameEs: materialNames?.es ?? materialId,
      nameEn: materialNames?.en ?? materialId,
    } satisfies RecipeMaterial;
  });

  const itemNames = names.get(itemId);
  return {
    itemId,
    baseItemId,
    nameEs: itemNames?.es ?? itemId,
    nameEn: itemNames?.en ?? itemId,
    tier,
    enchant,
    stationType: "alchemy",
    batchSize: Number(cr["@amountcrafted"]),
    craftingFocus: Number(cr["@craftingfocus"] ?? 0),
    materials,
  };
}

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
