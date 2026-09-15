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

type RawCraftResource = { "@uniquename": string; "@count": string; "@enchantmentlevel"?: string };
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

type RawSimpleItem = {
  "@uniquename": string;
  "@tier": string;
  "@enchantmentlevel"?: string;
  "@shopsubcategory1"?: string;
  craftingrequirements?: RawCraftingRequirements | RawCraftingRequirements[];
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
  stationType: "alchemy" | "refining" | "cooking";
  batchSize: number;
  craftingFocus: number;
  materials: RecipeMaterial[];
};

async function main() {
  console.log("Downloading ao-bin-dumps...");
  const [itemsRoot, formattedItems] = await Promise.all([
    fetchJson<{ items: { consumableitem: RawConsumableItem[]; simpleitem: RawSimpleItem[] } }>(ITEMS_URL),
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

    recipes.push(buildRecipe(baseItemId, baseItemId, tier, 0, "alchemy", potion.craftingrequirements!, names));

    const enchantments = potion.enchantments?.enchantment;
    if (enchantments) {
      for (const ench of asArray(enchantments)) {
        const level = Number(ench["@enchantmentlevel"]);
        const itemId = `${baseItemId}@${level}`;
        recipes.push(buildRecipe(itemId, baseItemId, tier, level, "alchemy", ench.craftingrequirements, names));
      }
    }
  }

  // Cocina: mismo patron anidado de "enchantments" que las pociones. Algunas lineas (los platos
  // "_AVALON") requieren una ficha de mision intransable en TODOS sus niveles, no solo en una
  // variante alternativa -- se descarta el item entero si su receta base la exige.
  const meals = itemsRoot.items.consumableitem.filter(
    (c) => c["@craftingcategory"] === "food" && c.craftingrequirements && !hasUntradeableMaterial(c.craftingrequirements),
  );
  for (const meal of meals) {
    const baseItemId = meal["@uniquename"];
    const tier = Number(meal["@tier"]);

    recipes.push(buildRecipe(baseItemId, baseItemId, tier, 0, "cooking", meal.craftingrequirements!, names));

    const enchantments = meal.enchantments?.enchantment;
    if (enchantments) {
      for (const ench of asArray(enchantments)) {
        const level = Number(ench["@enchantmentlevel"]);
        const itemId = `${baseItemId}@${level}`;
        recipes.push(buildRecipe(itemId, baseItemId, tier, level, "cooking", ench.craftingrequirements, names));
      }
    }
  }

  // Refinado: cada nivel de encantamiento (0-4) es su propio simpleitem de nivel superior, no un
  // bloque "enchantments" anidado como en las pociones. Algunos tienen recetas alternativas (con
  // fichas de facción) -- nos quedamos con la que no pida ninguna ficha.
  const refinedResources = itemsRoot.items.simpleitem.filter(
    (i) => i["@shopsubcategory1"] === "refinedresources" && i.craftingrequirements,
  );
  for (const item of refinedResources) {
    const itemUniqueName = item["@uniquename"];
    const tier = Number(item["@tier"]);
    const enchant = Number(item["@enchantmentlevel"] ?? 0);
    const itemId = enchant > 0 ? `${itemUniqueName}@${enchant}` : itemUniqueName;
    const baseItemId = itemUniqueName.replace(/_LEVEL\d+$/, "");
    const cr = pickCraftingRequirements(asArray(item.craftingrequirements!));
    recipes.push(buildRecipe(itemId, baseItemId, tier, enchant, "refining", cr, names));
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
  stationType: "alchemy" | "refining" | "cooking",
  cr: RawCraftingRequirements,
  names: Map<string, { es: string; en: string }>,
): Recipe {
  const materials = asArray(cr.craftresource ?? []).map((r) => {
    const materialId = resolveItemId(r["@uniquename"], r["@enchantmentlevel"], names);
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
    stationType,
    batchSize: Number(cr["@amountcrafted"]),
    craftingFocus: Number(cr["@craftingfocus"] ?? 0),
    materials,
  };
}

/**
 * Some item families (raw/refined resources) trade under `${uniquename}@${level}` for their
 * enchanted variants; others (arcane extracts) trade under the bare `_LEVELn` uniquename as-is.
 * Rather than hardcode which family does which, trust the formatted-names dump: if the suffixed
 * id exists there, that's the real market id.
 */
function resolveItemId(uniquename: string, enchantmentLevel: string | undefined, names: Map<string, unknown>): string {
  const level = Number(enchantmentLevel ?? 0);
  if (level > 0) {
    const suffixed = `${uniquename}@${level}`;
    if (names.has(suffixed)) return suffixed;
  }
  return uniquename;
}

/** Picks the plain-silver/materials recipe variant, skipping any that require a faction token. */
function pickCraftingRequirements(list: RawCraftingRequirements[]): RawCraftingRequirements {
  const withoutTokens = list.filter((cr) => !hasUntradeableMaterial(cr));
  return withoutTokens[0] ?? list[0];
}

/** True if any material in this recipe isn't a real tradeable item (quest tokens, event rewards). */
function hasUntradeableMaterial(cr: RawCraftingRequirements): boolean {
  return asArray(cr.craftresource ?? []).some((r) => /FACTION|QUESTITEM|^UNIQUE_|EVENT/.test(r["@uniquename"]));
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
