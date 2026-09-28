// Downloads ao-bin-dumps items.json and writes journals.json: which labourer journal each crafted
// gear item fills, the item's own journal-fame factor, and each journal's capacity per tier. Run
// manually when the game patches; not called at runtime.
//
// Deliberately separate from fetch-game-data.ts (same pattern as fetch-transport-data.ts): it reads
// that script's own output (recipes.json) to know which items matter, instead of touching the
// recipes pipeline or the DB.
//
// What the dump says (verified 2026-09-27):
// - Only four journals are filled by crafting (`famefillingmissions.craftitemfame`): WARRIOR
//   (Blacksmith), HUNTER (Fletcher), MAGE (Imbuer), TOOLMAKER (Tinker). Their `validitem` lists
//   name, per tier, exactly the items that fill them -- same tier only (a T5 sword never fills a T4
//   journal). Refining, alchemy and cooking fill no journal at all: ORE/WOOD/FIBER/HIDE/STONE are
//   gatherer journals (`gatherfame`), filled by gathering, not by refining.
// - `@maxfame` is the journal's capacity (T4 3,600 ... T8 58,590).
// - `@destinyandjournalcraftfamefactor` scales an artifact item's craft fame (1.1-1.4); absent = 1.
// - Royal gear carries `@famevalue="0"`: crafting it gives no fame, so it fills nothing.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import recipesJson from "../src/data/generated/recipes.json";
import { JOURNAL_TYPES, famePerResource, type JournalType } from "../src/lib/formulas/journal-fame";

const ITEMS_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json";
const FORMATTED_ITEMS_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json";
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "generated", "journals.json");

type RawNode = Record<string, unknown>;

async function main() {
  console.log("Downloading ao-bin-dumps items.json for journal data...");
  const res = await fetch(ITEMS_URL);
  if (!res.ok) throw new Error(`${ITEMS_URL}: HTTP ${res.status}`);
  const root = (await res.json()) as { items: Record<string, unknown> };

  const byUniqueName = new Map<string, RawNode>();
  walk(root.items, (node) => {
    const id = node["@uniquename"];
    // The first occurrence is the item's own definition; later ones are references to it inside
    // other items' crafting requirements, which carry only a count.
    if (typeof id === "string" && !byUniqueName.has(id) && "@tier" in node) byUniqueName.set(id, node);
  });

  // Sanity check on the fame-per-resource table: the dump still carries explicit `@famevalue`s for
  // the T4 enchanted refined resources (45/90/180/360), which must equal 22.5 x 2^enchant.
  for (const level of [1, 2, 3, 4]) {
    const node = byUniqueName.get(`T4_METALBAR_LEVEL${level}`);
    const dumpValue = Number(node?.["@famevalue"]);
    if (dumpValue !== famePerResource(4, level)) {
      throw new Error(`T4_METALBAR_LEVEL${level}: dump famevalue ${dumpValue} != table ${famePerResource(4, level)} -- the fame table drifted, re-derive it`);
    }
  }

  const maxFame = Object.fromEntries(JOURNAL_TYPES.map((t) => [t, {} as Record<string, number>])) as Record<JournalType, Record<string, number>>;
  const journalOf = new Map<string, JournalType>();
  for (const type of JOURNAL_TYPES) {
    for (let tier = 2; tier <= 8; tier++) {
      const journal = byUniqueName.get(`T${tier}_JOURNAL_${type}`);
      if (!journal) throw new Error(`T${tier}_JOURNAL_${type} missing from the dump`);
      maxFame[type][String(tier)] = Number(journal["@maxfame"]);
      const craft = (journal.famefillingmissions as RawNode | undefined)?.craftitemfame as RawNode | undefined;
      if (!craft) throw new Error(`T${tier}_JOURNAL_${type} is no longer filled by crafting`);
      for (const valid of asArray(craft.validitem as RawNode | RawNode[] | undefined)) {
        journalOf.set(String(valid["@id"]), type);
      }
    }
  }

  const gearBaseIds = new Set(
    (recipesJson as { baseItemId: string; stationType: string }[]).filter((r) => r.stationType === "gear").map((r) => r.baseItemId),
  );
  const byBaseItem: Record<string, [JournalType, number]> = {};
  let noFame = 0;
  for (const baseItemId of [...gearBaseIds].sort()) {
    const type = journalOf.get(baseItemId);
    if (!type) continue;
    const item = byUniqueName.get(baseItemId);
    if (item?.["@famevalue"] === "0" || item?.["@dontgivefameoncraft"] === "true") {
      noFame++;
      continue;
    }
    const factor = item?.["@destinyandjournalcraftfamefactor"];
    byBaseItem[baseItemId] = [type, factor !== undefined ? Number(factor) : 1];
  }

  // The in-game names of the exact journals to buy and sell ("Diario del herrero iniciado (vacío)"),
  // so the UI can say which one instead of just its type.
  const formattedRes = await fetch(FORMATTED_ITEMS_URL);
  if (!formattedRes.ok) throw new Error(`${FORMATTED_ITEMS_URL}: HTTP ${formattedRes.status}`);
  const formatted = (await formattedRes.json()) as { UniqueName: string; LocalizedNames?: Record<string, string> }[];
  const byId = new Map(formatted.map((i) => [i.UniqueName, i.LocalizedNames ?? {}]));
  const names: Record<string, [string, string, string]> = {};
  for (const type of JOURNAL_TYPES) {
    for (let tier = 2; tier <= 8; tier++) {
      for (const state of ["EMPTY", "FULL"]) {
        const id = `T${tier}_JOURNAL_${type}_${state}`;
        const n = byId.get(id);
        if (!n?.["ES-ES"] || !n["EN-US"] || !n["PT-BR"]) throw new Error(`${id} has no localized name in formatted/items.json`);
        names[id] = [n["ES-ES"], n["EN-US"], n["PT-BR"]];
      }
    }
  }

  await writeFile(OUTPUT_PATH, JSON.stringify({ maxFame, byBaseItem, names }, null, 2) + "\n");
  console.log(
    `Wrote ${Object.keys(byBaseItem).length} of ${gearBaseIds.size} gear base items to ${OUTPUT_PATH} ` +
      `(${noFame} give no craft fame, ${gearBaseIds.size - Object.keys(byBaseItem).length - noFame} fill no journal).`,
  );
}

function walk(node: unknown, visit: (n: RawNode) => void) {
  if (Array.isArray(node)) for (const child of node) walk(child, visit);
  else if (node && typeof node === "object") {
    visit(node as RawNode);
    for (const child of Object.values(node)) walk(child, visit);
  }
}

function asArray<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
