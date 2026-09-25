// Downloads the ao-bin-dumps files the transport calculator needs (items.json for item weight,
// spells.json for gathering-cape weight-reduction bonuses) and writes item-weights.json +
// gathering-capes.json into the repo. Run manually when the game patches; not called at runtime.
//
// Deliberately separate from fetch-game-data.ts: it reads that script's own output (recipes.json)
// to know which items need a weight, instead of touching the recipes pipeline or the DB.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import recipesJson from "../src/data/generated/recipes.json";

const ITEMS_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json";
const SPELLS_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/spells.json";
const FORMATTED_ITEMS_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json";
const GENERATED_DIR = path.join(__dirname, "..", "src", "data", "generated");
const WEIGHTS_OUTPUT_PATH = path.join(GENERATED_DIR, "item-weights.json");
const CAPES_OUTPUT_PATH = path.join(GENERATED_DIR, "gathering-capes.json");
const RAW_RESOURCES_OUTPUT_PATH = path.join(GENERATED_DIR, "raw-resources.json");

type LocalizedItem = { UniqueName: string; LocalizedNames?: Record<string, string> };
const RAW_RESOURCE_CATEGORIES = ["FIBER", "HIDE", "ORE", "ROCK", "WOOD"] as const;
const RAW_RESOURCE_TIERS = [2, 3, 4, 5, 6, 7, 8] as const;

type RawItem = { "@uniquename"?: string; "@weight"?: string };

type RawBuff = { "@type": string; "@value": string };
type RawWeightBonus = { "@item": string; "@value": string };
type RawPassiveSpell = {
  "@uniquename": string;
  buff?: RawBuff | RawBuff[];
  weightbonus?: RawWeightBonus | RawWeightBonus[];
};

const GATHERING_CATEGORIES = ["FIBER", "HIDE", "ORE", "ROCK", "WOOD", "FISH"] as const;
const CAPE_TIERS = [4, 5, 6, 7, 8] as const;

async function main() {
  console.log("Downloading ao-bin-dumps for transport data...");
  const [itemsRoot, spellsRoot, formattedItems] = await Promise.all([
    fetchJson<{ items: Record<string, unknown> }>(ITEMS_URL),
    fetchJson<{ spells: { passivespell: RawPassiveSpell[] } }>(SPELLS_URL),
    fetchJson<LocalizedItem[]>(FORMATTED_ITEMS_URL),
  ]);
  const namesEs = new Map<string, string>();
  for (const item of formattedItems) {
    const es = item.LocalizedNames?.["ES-ES"];
    if (es) namesEs.set(item.UniqueName, es);
  }

  // items.json's top-level categories (weapon, equipmentitem, mount, consumableitem, simpleitem,
  // ...) all share the same flat `@weight` attribute -- one pass over every category, keyed by
  // uniquename, covers every item this script will ever need to look up.
  const weightByItemId = new Map<string, number>();
  for (const [key, value] of Object.entries(itemsRoot.items)) {
    if (key.startsWith("@")) continue;
    for (const item of asArray(value as RawItem | RawItem[])) {
      if (!item || typeof item !== "object" || !item["@uniquename"] || item["@weight"] === undefined) continue;
      weightByItemId.set(item["@uniquename"], Number(item["@weight"]));
    }
  }

  // Gathering capes (`PASSIVE_BACKPACK_<CATEGORY>_T<tier>`) state their own weight-reduction as an
  // explicit per-item `weightbonus` list -- unlike bag/mount/shoe max-load, which scale through an
  // undocumented item-power curve, this one is a flat, parseable fact (confirmed 0.3 = 30% at every
  // tier, per player-community testing -- see docs/transport-data.md).
  const capes: Record<string, Record<number, { reductionPct: number; itemIds: string[] }>> = {};
  const resourceItemIds = new Set<string>();
  for (const category of GATHERING_CATEGORIES) {
    capes[category] = {};
    for (const tier of CAPE_TIERS) {
      const spell = spellsRoot.spells.passivespell.find((s) => s["@uniquename"] === `PASSIVE_BACKPACK_${category}_T${tier}`);
      if (!spell?.weightbonus) continue;
      const entries = asArray(spell.weightbonus);
      const reductions = new Set(entries.map((e) => Number(e["@value"])));
      if (reductions.size !== 1) throw new Error(`PASSIVE_BACKPACK_${category}_T${tier}: expected one uniform reduction, got ${[...reductions]}`);
      const itemIds = entries.map((e) => e["@item"]);
      itemIds.forEach((id) => resourceItemIds.add(id));
      capes[category][tier] = { reductionPct: [...reductions][0], itemIds };
    }
  }
  await writeFile(CAPES_OUTPUT_PATH, JSON.stringify(capes, null, 2) + "\n", "utf8");
  console.log(`Wrote gathering-cape data (${GATHERING_CATEGORIES.length} categories) to ${CAPES_OUTPUT_PATH}`);

  // Universe of items this app can ever offer to "transport": every recipe's own output, every
  // material any recipe references, plus every raw resource a gathering cape can discount above --
  // covers potions/meals/refined goods/gear/mounts and the raw resources gathering feeds them from.
  const recipes = recipesJson as { itemId: string; materials: { itemId: string }[] }[];
  const wantedItemIds = new Set<string>(resourceItemIds);
  for (const r of recipes) {
    wantedItemIds.add(r.itemId);
    for (const m of r.materials) wantedItemIds.add(m.itemId);
  }

  const weights: Record<string, number> = {};
  const missing: string[] = [];
  for (const itemId of wantedItemIds) {
    // Recipe item ids the app itself suffixes with "@N" (see fetch-game-data.ts's resolveItemId)
    // don't carry their own weight in the dump -- their un-suffixed base item does, and weight
    // never changes across a line's enchantment levels (confirmed against several bag/gear lines).
    const bareId = itemId.replace(/@\d+$/, "");
    const weight = weightByItemId.get(bareId);
    if (weight === undefined) {
      missing.push(itemId);
      continue;
    }
    weights[itemId] = weight;
  }
  await writeFile(WEIGHTS_OUTPUT_PATH, JSON.stringify(weights, null, 2) + "\n", "utf8");
  console.log(`Wrote ${Object.keys(weights).length} item weights to ${WEIGHTS_OUTPUT_PATH}`);
  if (missing.length > 0) {
    console.log(`${missing.length} items had no @weight in the dump (bred/crafted-only intermediates with no direct market form, expected): ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? ", ..." : ""}`);
  }

  // Raw resources aren't recipe outputs in this app (nothing "crafts" them, they're gathered), so
  // they never get a nameEs from recipes.json's own materials -- resolved here instead, straight
  // from the dump's own localization file, for the transport tool's "add a raw resource" picker.
  const rawResources = RAW_RESOURCE_CATEGORIES.flatMap((category) =>
    RAW_RESOURCE_TIERS.map((tier) => ({ itemId: `T${tier}_${category}`, tier, category })),
  ).filter((r) => weights[r.itemId] !== undefined)
    .map((r) => ({ ...r, nameEs: namesEs.get(r.itemId) ?? r.itemId }));
  await writeFile(RAW_RESOURCES_OUTPUT_PATH, JSON.stringify(rawResources, null, 2) + "\n", "utf8");
  console.log(`Wrote ${rawResources.length} raw resources to ${RAW_RESOURCES_OUTPUT_PATH}`);
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
