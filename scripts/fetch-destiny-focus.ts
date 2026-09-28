// Downloads the ao-bin-dumps Destiny Board (achievements.xml), its names (localization.xml) and the
// focus cost constant (gamedata.xml), and writes destiny-focus.json: every Destiny Board node that
// lowers the crafting focus cost of an item PlataRank ranks, with its per-level bonus. Run manually
// when the game patches; not called at runtime. Same pattern as fetch-journal-data.ts: it reads
// recipes.json to know which items matter and never touches the recipes pipeline or the DB.
//
// What the dump says (verified 2026-09-28, and against an in-game focus cost -- see
// tests/destiny-focus.test.ts):
// - gamedata.xml <ActionFocus costreductionconstant="1.00695555005672">: cost = base x c^(-points),
//   and c^100 = 2, so the cost halves every 100 dump points. The client shows those points x100
//   ("Bono de Eficiencia de Coste de Foco"): halves every 10,000 displayed points (FCE).
// - achievements.xml: each node's <bonus type="craftingfocuscostreduction" bonus=".."> is PER
//   LEVEL and applies to the items its <itempattern>s match, within mintier..maxtier. E.g. a gear
//   specialization gives 2.5 (250 FCE) per level to its own item and 0.3 (30) or 0.15 (15, artifact
//   specs) to the rest of its category; a mastery 0.3 (30) to the whole category.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import recipesJson from "../src/data/generated/recipes.json";
import { FCE_PER_HALVING } from "../src/lib/formulas/focus-cost";

const BASE = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master";
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "generated", "destiny-focus.json");

type RawBonus = { "@_type": string; "@_bonus": string; "@_mintier"?: string; "@_maxtier"?: string; itempattern?: { "@_pattern": string }[] };
type RawNode = {
  "@_id": string;
  "@_usetemplate"?: string;
  title?: { "@_tag": string };
  baserewards?: { bonus?: RawBonus[] };
};
type RawTemplate = { "@_name": string; baselevels?: string | { "#text"?: string } };

export type DestinyNode = {
  id: string;
  /** "mastery": a category node (Alquimista, Forjador de espadas...). "spec": one item line. */
  kind: "mastery" | "spec";
  nameEs: string;
  nameEn: string;
  namePt: string;
  maxLevel: number;
  bonuses: { fcePerLevel: number; minTier: number; maxTier: number; patterns: string[] }[];
};

async function main() {
  console.log("Downloading ao-bin-dumps Destiny Board data...");
  const [achievementsXml, localizationXml, gamedataXml] = await Promise.all(
    ["achievements.xml", "localization.xml", "gamedata.xml"].map(async (f) => {
      const res = await fetch(`${BASE}/${f}`);
      if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
      return res.text();
    }),
  );

  // The halving rule this whole feature rests on: fail loudly if a patch changes it.
  const constant = Number(gamedataXml.match(/<ActionFocus costreductionconstant="([0-9.]+)"/)?.[1]);
  if (!(Math.abs(constant ** (FCE_PER_HALVING / 100) - 2) < 1e-9)) {
    throw new Error(`ActionFocus costreductionconstant ${constant} no longer halves the cost every ${FCE_PER_HALVING} FCE`);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => ["templateachievement", "template", "bonus", "itempattern"].includes(name),
  });
  const root = parser.parse(achievementsXml).achievements as { template: RawTemplate[]; templateachievement: RawNode[] };

  const levelsByTemplate = new Map<string, number>();
  for (const t of root.template ?? []) {
    const text = typeof t.baselevels === "object" ? (t.baselevels["#text"] ?? "") : (t.baselevels ?? "");
    const rows = String(text).split("\n").filter((l) => /^\s*\d+;/.test(l));
    levelsByTemplate.set(t["@_name"], rows.length);
  }

  const baseItemIds = [...new Set((recipesJson as { baseItemId: string }[]).map((r) => r.baseItemId))];
  const matchesAnyRecipe = (patterns: string[]) => patterns.some((p) => baseItemIds.some((id) => patternRegex(p).test(id)));

  const wanted: { raw: RawNode; bonuses: DestinyNode["bonuses"] }[] = [];
  for (const node of root.templateachievement ?? []) {
    const bonuses = (node.baserewards?.bonus ?? [])
      .filter((b) => b["@_type"] === "craftingfocuscostreduction")
      .map((b) => ({
        // Dump points -> the FCE the client displays.
        fcePerLevel: Math.round(Number(b["@_bonus"]) * 100 * 1000) / 1000,
        minTier: Number(b["@_mintier"] ?? 1),
        maxTier: Number(b["@_maxtier"] ?? 8),
        patterns: (b.itempattern ?? []).map((p) => p["@_pattern"]),
      }))
      .filter((b) => b.fcePerLevel > 0 && matchesAnyRecipe(b.patterns));
    if (bonuses.length > 0) wanted.push({ raw: node, bonuses });
  }

  const tags = new Set(wanted.map((w) => w.raw.title?.["@_tag"]).filter((t): t is string => Boolean(t)));
  const names = localizedNames(localizationXml, tags);

  const nodes: DestinyNode[] = wanted.map(({ raw, bonuses }) => {
    const template = raw["@_usetemplate"] ?? "";
    const tag = raw.title?.["@_tag"] ?? "";
    const maxLevel = levelsByTemplate.get(template) ?? 100;
    return {
      id: raw["@_id"],
      kind: /BASE$/.test(template) ? "mastery" : "spec",
      nameEs: names.get(tag)?.es ?? raw["@_id"],
      nameEn: names.get(tag)?.en ?? raw["@_id"],
      namePt: names.get(tag)?.pt ?? raw["@_id"],
      maxLevel,
      bonuses,
    };
  });

  await writeFile(OUTPUT_PATH, JSON.stringify({ fcePerHalving: FCE_PER_HALVING, nodes }) + "\n");
  console.log(`Wrote ${nodes.length} Destiny Board nodes (${nodes.filter((n) => n.kind === "mastery").length} masteries) to ${OUTPUT_PATH}.`);
}

/** Destiny Board item patterns: "T?" is any tier, a trailing "*" any suffix. */
function patternRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\?/g, "\\d+").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

/** Spanish and English names for the given localization tags, streamed with a regex rather than a
 * full parse (the file is ~75 MB and every other language is irrelevant here). */
function localizedNames(xml: string, tags: Set<string>): Map<string, { es: string; en: string; pt: string }> {
  const out = new Map<string, { es: string; en: string; pt: string }>();
  const tu = /<tu tuid="([^"]+)">([\s\S]*?)<\/tu>/g;
  for (let m = tu.exec(xml); m; m = tu.exec(xml)) {
    if (!tags.has(m[1])) continue;
    const seg = (lang: string) => m![2].match(new RegExp(`<tuv xml:lang="${lang}">\\s*<seg>([\\s\\S]*?)</seg>`))?.[1];
    out.set(m[1], { es: seg("ES-ES") ?? seg("EN-US") ?? m[1], en: seg("EN-US") ?? m[1], pt: seg("PT-BR") ?? seg("EN-US") ?? m[1] });
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
