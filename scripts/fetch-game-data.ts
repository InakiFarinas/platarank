// Downloads every ao-bin-dumps file the recipe generator needs (items.json for crafting
// requirements, formatted/items.json for localized names, craftingmodifiers.xml for city
// specialties, gamedata.xml for the crafting-quality distribution), builds the derived
// recipes.json + city-specialties.json + quality-mechanics.json, and writes them into the repo.
// Run manually when the game patches; not called at runtime.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import { classifyMaterial } from "../src/lib/materials/classify";
import type { RecipeMaterial } from "../src/lib/db/schema";

const ITEMS_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json";
const FORMATTED_ITEMS_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json";
const CRAFTING_MODIFIERS_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/craftingmodifiers.xml";
const GAMEDATA_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/gamedata.xml";
const GENERATED_DIR = path.join(__dirname, "..", "src", "data", "generated");
const RECIPES_OUTPUT_PATH = path.join(GENERATED_DIR, "recipes.json");
const CITY_SPECIALTIES_OUTPUT_PATH = path.join(GENERATED_DIR, "city-specialties.json");
const QUALITY_MECHANICS_OUTPUT_PATH = path.join(GENERATED_DIR, "quality-mechanics.json");

// Only the 7 real cities have a name in the game; craftingmodifiers.xml also lists ~140 other
// clusters (hideouts, Outlands islands) we don't need yet. Verified against the file's own
// <!--cityname--> comments and the clusterids the brief called out.
const CLUSTER_ID_TO_CITY: Record<string, string> = {
  "0000": "Thetford",
  "1000": "Lymhurst",
  "2000": "Bridgewatch",
  "3004": "Martlock",
  "4000": "Fort Sterling",
  "3003": "Caerleon",
  "5000": "Brecilien",
};

type RawCraftResource = { "@uniquename": string; "@count": string; "@enchantmentlevel"?: string };
type RawCraftingRequirements = {
  "@amountcrafted"?: string;
  "@craftingfocus"?: string;
  craftresource?: RawCraftResource | RawCraftResource[];
};
type RawEnchantment = {
  "@enchantmentlevel": string;
  craftingrequirements: RawCraftingRequirements | RawCraftingRequirements[];
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

type RawGearItem = {
  "@uniquename": string;
  "@tier": string;
  "@craftingcategory"?: string;
  "@maxqualitylevel"?: string;
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
  stationType: "alchemy" | "refining" | "cooking" | "gear";
  /** Item's own craftingcategory (e.g. "potion", "wood", "sword", "plate_armor"). Null when the
   * dump has none (e.g. faction/artifact capes) -- those get no city-specialty bonus, ever. */
  craftingCategory: string | null;
  maxQualityLevel: number;
  batchSize: number;
  craftingFocus: number;
  materials: RecipeMaterial[];
};

// Weapons and armor pieces this project ranks (see brief section 7). Excludes "tools" and
// "gatherergear" (Caerleon's OTHER two crafting specialties -- gathering gear, not "armas y
// armaduras") and "bag"/"cape" (Brecilien's other two, out of this rubro's scope).
const WEAPON_CATEGORIES = new Set([
  "arcanestaff",
  "axe",
  "bow",
  "crossbow",
  "cursestaff",
  "dagger",
  "firestaff",
  "froststaff",
  "hammer",
  "holystaff",
  "knuckles",
  "mace",
  "naturestaff",
  "quarterstaff",
  "spear",
  "sword",
]);
const ARMOR_CATEGORIES = new Set([
  "cloth_armor",
  "cloth_helmet",
  "cloth_shoes",
  "leather_armor",
  "leather_helmet",
  "leather_shoes",
  "plate_armor",
  "plate_helmet",
  "plate_shoes",
  "offhand",
]);

async function main() {
  console.log("Downloading ao-bin-dumps...");
  const [itemsRoot, formattedItems, craftingModifiersXml, gamedataXml] = await Promise.all([
    fetchJson<{
      items: {
        consumableitem: RawConsumableItem[];
        simpleitem: RawSimpleItem[];
        weapon: RawGearItem[];
        equipmentitem: RawGearItem[];
      };
    }>(ITEMS_URL),
    fetchJson<LocalizedItem[]>(FORMATTED_ITEMS_URL),
    fetchText(CRAFTING_MODIFIERS_URL),
    fetchText(GAMEDATA_URL),
  ]);

  const names = new Map<string, { es: string; en: string }>();
  for (const item of formattedItems) {
    if (!item.LocalizedNames) continue;
    names.set(item.UniqueName, {
      es: item.LocalizedNames["ES-ES"] ?? item.UniqueName,
      en: item.LocalizedNames["EN-US"] ?? item.UniqueName,
    });
  }

  await writeCitySpecialties(craftingModifiersXml);
  await writeQualityMechanics(gamedataXml);

  const potions = itemsRoot.items.consumableitem.filter(
    (c) => c["@craftingcategory"] === "potion" && c.craftingrequirements,
  );

  const recipes: Recipe[] = [];
  for (const potion of potions) {
    const baseItemId = potion["@uniquename"];
    const tier = Number(potion["@tier"]);
    const category = potion["@craftingcategory"] ?? null;

    recipes.push(buildRecipe(baseItemId, baseItemId, tier, 0, "alchemy", category, 1, potion.craftingrequirements!, names));

    const enchantments = potion.enchantments?.enchantment;
    if (enchantments) {
      for (const ench of asArray(enchantments)) {
        const level = Number(ench["@enchantmentlevel"]);
        const itemId = `${baseItemId}@${level}`;
        const cr = pickCraftingRequirements(asArray(ench.craftingrequirements));
        recipes.push(buildRecipe(itemId, baseItemId, tier, level, "alchemy", category, 1, cr, names));
      }
    }
  }

  // Cocina: mismo patron anidado de "enchantments" que las pociones. Algunas lineas (los platos
  // "_AVALON") requieren una ficha de mision intransable en TODOS sus niveles, no solo en una
  // variante alternativa -- se descarta el item entero si su receta base la exige.
  const meals = itemsRoot.items.consumableitem.filter(
    (c) => c["@craftingcategory"] === "food" && c.craftingrequirements && !hasBlockedMaterial(c.craftingrequirements),
  );
  for (const meal of meals) {
    const baseItemId = meal["@uniquename"];
    const tier = Number(meal["@tier"]);
    const category = meal["@craftingcategory"] ?? null;

    recipes.push(buildRecipe(baseItemId, baseItemId, tier, 0, "cooking", category, 1, meal.craftingrequirements!, names));

    const enchantments = meal.enchantments?.enchantment;
    if (enchantments) {
      for (const ench of asArray(enchantments)) {
        const level = Number(ench["@enchantmentlevel"]);
        const itemId = `${baseItemId}@${level}`;
        const cr = pickCraftingRequirements(asArray(ench.craftingrequirements));
        recipes.push(buildRecipe(itemId, baseItemId, tier, level, "cooking", category, 1, cr, names));
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
    // Resource category (wood/ore/fiber/hide/rock) lives on the BASE item, not on every enchant
    // level's own entry -- read craftingcategory off the plain simpleitem record if present.
    const category = (item as RawSimpleItem & { "@craftingcategory"?: string })["@craftingcategory"] ?? null;
    recipes.push(buildRecipe(itemId, baseItemId, tier, enchant, "refining", category, 1, cr, names));
  }

  // Armas y armaduras (Fase 3, seccion 7). Incluye TODO -- equipo estandar y lineas especiales de
  // faccion/hellgate que exigen artefactos raros -- a pedido explicito: esas ultimas van a quedar
  // con "datos insuficientes" cuando el artefacto no tenga precio de mercado confiable, lo cual es
  // el comportamiento honesto ya establecido, no un caso especial nuevo.
  const gearItems = [
    ...itemsRoot.items.weapon.filter((w) => w["@craftingcategory"] && WEAPON_CATEGORIES.has(w["@craftingcategory"])),
    ...itemsRoot.items.equipmentitem.filter((e) => e["@craftingcategory"] && ARMOR_CATEGORIES.has(e["@craftingcategory"])),
  ].filter((g) => g.craftingrequirements);

  for (const gear of gearItems) {
    const baseItemId = gear["@uniquename"];
    const tier = Number(gear["@tier"]);
    const category = gear["@craftingcategory"] ?? null;
    const maxQuality = Number(gear["@maxqualitylevel"] ?? 1);

    recipes.push(buildRecipe(baseItemId, baseItemId, tier, 0, "gear", category, maxQuality, gear.craftingrequirements!, names));

    const enchantments = gear.enchantments?.enchantment;
    if (enchantments) {
      for (const ench of asArray(enchantments)) {
        const level = Number(ench["@enchantmentlevel"]);
        const itemId = `${baseItemId}@${level}`;
        const cr = pickCraftingRequirements(asArray(ench.craftingrequirements));
        recipes.push(buildRecipe(itemId, baseItemId, tier, level, "gear", category, maxQuality, cr, names));
      }
    }
  }

  recipes.sort((a, b) => a.itemId.localeCompare(b.itemId));
  await writeFile(RECIPES_OUTPUT_PATH, JSON.stringify(recipes, null, 2) + "\n", "utf8");
  console.log(`Wrote ${recipes.length} recipes to ${RECIPES_OUTPUT_PATH}`);
}

function buildRecipe(
  itemId: string,
  baseItemId: string,
  tier: number,
  enchant: number,
  stationType: Recipe["stationType"],
  craftingCategory: string | null,
  maxQualityLevel: number,
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
    craftingCategory,
    maxQualityLevel,
    batchSize: Number(cr["@amountcrafted"] ?? 1),
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
  const withoutTokens = list.filter((cr) => !hasBlockedMaterial(cr));
  return withoutTokens[0] ?? list[0];
}

/** True if any material in this recipe isn't a real tradeable item (quest tokens, event rewards). */
function hasBlockedMaterial(cr: RawCraftingRequirements): boolean {
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

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return res.text();
}

type CitySpecialty = { category: string; city: string; kind: "crafting" | "refining" | "meat"; bonus: number };

async function writeCitySpecialties(xml: string) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@" });
  const parsed = parser.parse(xml) as {
    craftingmodifiers: {
      refiningcategory: { item: { "@category": string } | { "@category": string }[] };
      craftinglocation: RawCraftingLocation[];
    };
  };

  const refiningCategories = new Set(
    asArray(parsed.craftingmodifiers.refiningcategory.item).map((i) => i["@category"]),
  );

  const specialties: CitySpecialty[] = [];
  for (const location of asArray(parsed.craftingmodifiers.craftinglocation)) {
    const city = CLUSTER_ID_TO_CITY[location["@clusterid"]];
    if (!city) continue; // one of the ~140 other clusters (hideouts, islands) -- not needed yet

    for (const modifier of asArray(location.craftingmodifier ?? [])) {
      const category = modifier["@name"];
      const bonus = Number(modifier["@value"]);
      const kind: CitySpecialty["kind"] = refiningCategories.has(category)
        ? "refining"
        : category.startsWith("meat_")
          ? "meat"
          : "crafting";
      specialties.push({ category, city, kind, bonus });
    }
  }

  await writeFile(CITY_SPECIALTIES_OUTPUT_PATH, JSON.stringify(specialties, null, 2) + "\n", "utf8");
  console.log(`Wrote ${specialties.length} city specialties to ${CITY_SPECIALTIES_OUTPUT_PATH}`);
}

type RawCraftingLocation = {
  "@clusterid": string;
  craftingmodifier?: { "@name": string; "@value": string } | { "@name": string; "@value": string }[];
};

async function writeQualityMechanics(xml: string) {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@" });
  const parsed = parser.parse(xml) as {
    "AO-GameData": {
      CraftingQualityChances: { QualityLevel: { "@level": string; "@weight": string }[] };
    };
  };

  const levels = parsed["AO-GameData"].CraftingQualityChances.QualityLevel;
  const totalWeight = levels.reduce((sum, l) => sum + Number(l["@weight"]), 0);
  const craftingQualityWeights = levels
    .sort((a, b) => Number(a["@level"]) - Number(b["@level"]))
    .map((l) => Number(l["@weight"]) / totalWeight);

  await writeFile(
    QUALITY_MECHANICS_OUTPUT_PATH,
    JSON.stringify({ craftingQualityWeights }, null, 2) + "\n",
    "utf8",
  );
  console.log(`Wrote quality mechanics (weights: ${craftingQualityWeights.join(", ")}) to ${QUALITY_MECHANICS_OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
