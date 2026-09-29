// Downloads ao-bin-dumps hideouts.xml and craftingmodifiers.xml and writes hideout-bonuses.json: the
// production bonuses of crafting in a guild Hideout (black zone or Roads of Avalon) and on an island.
// Run manually when the game patches; not called at runtime.
//
// What the dump says (verified 2026-09-29), and what the wiki and patch notes confirm:
// - hideouts.xml <powerlevel>: every Power Level (1-9, raised with Power Cores) adds
//   `generalistcraftingbonus` to all crafting in the Hideout and `specialistcraftingbonus` on top to
//   the Hideout's crafting specialties (in-game: "{0} to crafting and {1} to crafting specialties in
//   this Hideout"). Crafting only: the wiki gives black zone hideouts a flat 15% refining, and the
//   Beyond the Veil patch notes cut Roads hideouts' refining to a flat 10% while their crafting
//   "can be improved to 26% through Power".
// - craftingmodifiers.xml, OUTLANDS entries (one per biome x zone quality): `refiningbonus` 0.15
//   and no `craftingbonus` at all -- the royal cities' 18% base doesn't exist there ("Hideouts
//   don't provide any general bonuses to crafting beyond those based on Power Level"). Each biome
//   lists five crafting specialties, the same five as its royal city (Swamp = Thetford's, ...),
//   worth 1% (Q1) to 26% (Q6).
// - Roads of Avalon (TNL-* clusters): `refiningbonus` 0.10, +10% to one refined resource and 1% to
//   five crafting categories that differ road by road (50 combinations), so the player tells us
//   whether the item is one of their road's specialties.
// - Royal cities carry `islandvalue="0"` on both bonuses: crafting on an island has no base bonus.
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const BASE = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master";
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "generated", "hideout-bonuses.json");
const BIOMES = ["SWAMP", "FOREST", "STEPPE", "HIGHLAND", "MOUNTAIN"] as const;

type Attrs = Record<string, string>;
type Location = Attrs & { refiningbonus?: Attrs | Attrs[]; craftingbonus?: Attrs | Attrs[]; craftingmodifier?: Attrs | Attrs[] };

async function fetchText(file: string): Promise<string> {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.text();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

async function main() {
  console.log("Downloading ao-bin-dumps hideouts.xml and craftingmodifiers.xml...");
  const [hideoutsXml, modifiersXml] = await Promise.all([fetchText("hideouts.xml"), fetchText("craftingmodifiers.xml")]);
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

  const hideouts = parser.parse(hideoutsXml) as { hideouts: { hideout: { powerlevels: { powerlevel: Attrs[] } } } };
  const powerLevels = hideouts.hideouts.hideout.powerlevels.powerlevel
    .map((p) => ({ level: Number(p.level), generalist: Number(p.generalistcraftingbonus ?? 0), specialist: Number(p.specialistcraftingbonus ?? 0) }))
    .sort((a, b) => a.level - b.level);
  if (powerLevels.length !== 9 || powerLevels.some((p, i) => p.level !== i + 1 || !Number.isFinite(p.generalist) || !Number.isFinite(p.specialist))) {
    throw new Error(`hideouts.xml: expected Power Levels 1-9, got ${JSON.stringify(powerLevels)}`);
  }

  const modifiers = parser.parse(modifiersXml) as { craftingmodifiers: { craftinglocation: Location[] } };
  const locations = modifiers.craftingmodifiers.craftinglocation;

  // Black zone: one entry per biome and zone quality. The biome's specialties must not depend on
  // the quality, and the quality's value must not depend on the biome -- that's what lets the UI
  // ask for them separately.
  const specialties: Record<string, string[]> = {};
  const zoneBonus: Record<string, number> = {};
  let outlandsRefining: number | null = null;
  for (const loc of locations.filter((l) => l.continent === "OUTLANDS")) {
    const biome = loc.biome;
    const quality = loc.clusterquality?.replace(/^Q/, "");
    if (!(BIOMES as readonly string[]).includes(biome) || !quality) throw new Error(`Unexpected OUTLANDS entry ${JSON.stringify(loc)}`);
    if (asArray(loc.craftingbonus).length > 0) throw new Error(`OUTLANDS ${biome} Q${quality} now has a base craftingbonus -- the model assumes none`);
    const refining = Number(asArray(loc.refiningbonus)[0]?.value);
    if (outlandsRefining !== null && refining !== outlandsRefining) throw new Error(`OUTLANDS refining bonus differs by zone (${refining} vs ${outlandsRefining})`);
    outlandsRefining = refining;
    const mods = asArray(loc.craftingmodifier);
    const values = new Set(mods.map((m) => Number(m.value)));
    if (values.size !== 1) throw new Error(`OUTLANDS ${biome} Q${quality}: specialties with different values`);
    const value = [...values][0];
    if (zoneBonus[quality] !== undefined && zoneBonus[quality] !== value) throw new Error(`Zone Q${quality} bonus differs by biome`);
    zoneBonus[quality] = value;
    const names = mods.map((m) => m.name).sort();
    if (specialties[biome] && specialties[biome].join() !== names.join()) throw new Error(`${biome} specialties differ by zone quality`);
    specialties[biome] = names;
  }
  if (Object.keys(specialties).length !== BIOMES.length || Object.keys(zoneBonus).length !== 6 || outlandsRefining === null) {
    throw new Error(`craftingmodifiers.xml: incomplete OUTLANDS data (${Object.keys(specialties)}, ${Object.keys(zoneBonus)})`);
  }

  // Roads of Avalon: a flat refining bonus plus per-road specialties (read the crafting one's value).
  const roads = locations.filter((l) => l.clusterid?.startsWith("TNL-"));
  const roadRefining = new Set(roads.map((l) => Number(asArray(l.refiningbonus)[0]?.value)));
  const refiningCategories = new Set(["fiber", "ore", "rock", "wood", "hide"]);
  const roadCrafting = new Set(roads.flatMap((l) => asArray(l.craftingmodifier).filter((m) => !refiningCategories.has(m.name)).map((m) => Number(m.value))));
  const roadResource = new Set(roads.flatMap((l) => asArray(l.craftingmodifier).filter((m) => refiningCategories.has(m.name)).map((m) => Number(m.value))));
  if (roads.length === 0 || roadRefining.size !== 1 || roadCrafting.size !== 1 || roadResource.size !== 1) {
    throw new Error(`Roads of Avalon bonuses are no longer uniform: refining ${[...roadRefining]}, crafting ${[...roadCrafting]}, resource ${[...roadResource]}`);
  }

  // Islands: every royal city zeroes both bonuses on its islands.
  const islandValues = new Set(
    locations.filter((l) => l.clusterid && !l.clusterid.startsWith("TNL-")).flatMap((l) => [...asArray(l.craftingbonus), ...asArray(l.refiningbonus)].map((b) => b.islandvalue)),
  );
  if ([...islandValues].some((v) => v !== undefined && Number(v) !== 0)) throw new Error(`An island bonus is no longer 0: ${[...islandValues]}`);

  const out = {
    powerLevels,
    outlands: { refining: outlandsRefining, zoneBonus, specialties },
    roads: { refining: [...roadRefining][0], resourceSpecialty: [...roadResource][0], craftingSpecialty: [...roadCrafting][0] },
    island: { crafting: 0, refining: 0 },
  };
  await writeFile(OUTPUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${OUTPUT_PATH}: ${powerLevels.length} power levels, ${BIOMES.length} biomes, ${roads.length} roads.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
