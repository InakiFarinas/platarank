import { RECIPES } from "@/lib/recipes-data";
import { RAW_RESOURCES } from "@/lib/raw-resources-data";
import { ARTIFACT_POOLS } from "@/lib/artifacts";
import journalsJson from "@/data/generated/journals.json";

export type FlipItem = { itemId: string; tier: number; nameEs: string; nameEn: string; namePt?: string };

// JSON imports widen tuples to arrays; the shape is fixed by scripts/fetch-journal-data.ts (see journals.ts).
const journalNames = (journalsJson as unknown as { names: Record<string, [string, string, string]> }).names;
const JOURNAL_ITEMS: FlipItem[] = Object.entries(journalNames).map(([itemId, [nameEs, nameEn, namePt]]) => ({
  itemId,
  tier: Number(itemId.match(/^T(\d+)_/)?.[1] ?? 0),
  nameEs,
  nameEn,
  namePt,
}));

/** Everything this app can flip with a real (never fabricated) name: recipe outputs (crafted gear,
 * refined materials, potions, food, mounts -- `recipes.json`), raw gatherable resources, laborer
 * journals, and Foundry artifacts. Built from 4 zero-overlap sources (confirmed by /impeccable
 * research 2026-10), deduplicated defensively by itemId. The ~343 priced `market_aggregates` items
 * outside this union (enchanted raw resources, faction/Avalonian materials outside the Foundry
 * pools, raw cooking/fishing ingredients, unnamed breeding mounts, refining catalysts) are left out
 * on purpose rather than shown under a fabricated or raw-id name -- see /es/flipping's own FAQ. */
export const FLIP_ITEMS: readonly FlipItem[] = (() => {
  const byId = new Map<string, FlipItem>();
  for (const r of RECIPES) byId.set(r.itemId, { itemId: r.itemId, tier: r.tier, nameEs: r.nameEs, nameEn: r.nameEn ?? r.nameEs, namePt: r.namePt ?? undefined });
  for (const r of RAW_RESOURCES) byId.set(r.itemId, { itemId: r.itemId, tier: r.tier, nameEs: r.nameEs, nameEn: r.nameEn, namePt: r.namePt });
  for (const j of JOURNAL_ITEMS) byId.set(j.itemId, j);
  for (const p of ARTIFACT_POOLS) for (const a of p.artifacts) byId.set(a.itemId, { itemId: a.itemId, tier: p.tier, nameEs: a.nameEs, nameEn: a.nameEn, namePt: a.namePt });
  return [...byId.values()];
})();

export const FLIP_ITEM_IDS: readonly string[] = FLIP_ITEMS.map((i) => i.itemId);

const BY_ID = new Map(FLIP_ITEMS.map((i) => [i.itemId, i]));

export function flipItemById(itemId: string): FlipItem | null {
  return BY_ID.get(itemId) ?? null;
}
