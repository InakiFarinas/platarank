/** Labourer journals filled by crafting -- the only four the game has (see
 * scripts/fetch-journal-data.ts): Blacksmith, Fletcher, Imbuer, Tinker. */
export const JOURNAL_TYPES = ["WARRIOR", "HUNTER", "MAGE", "TOOLMAKER"] as const;
export type JournalType = (typeof JOURNAL_TYPES)[number];

/** Base craft fame per refined resource consumed, by tier, at enchant 0. Each enchant level doubles
 * it. Only T4's enchanted values survive as explicit `@famevalue`s in items.json (45/90/180/360);
 * fetch-journal-data.ts fails if those ever stop matching this table. The rest is the table the
 * community tools use (e.g. Triky313's StatisticsAnalysisTool, CraftingJournalService). */
const FAME_PER_RESOURCE_BY_TIER: Record<number, number> = { 2: 1.5, 3: 7.5, 4: 22.5, 5: 90, 6: 270, 7: 645, 8: 1395 };

export function famePerResource(tier: number, enchant: number): number {
  return (FAME_PER_RESOURCE_BY_TIER[tier] ?? 0) * 2 ** enchant;
}

// Journal fame counts the refined resources only: artifacts (runic/soul/relic/avalonian), Tomes of
// Insight, Avalonian tokens and faction crests add none.
const REFINED_RESOURCE = /^T\d+_(PLANKS|METALBAR|LEATHER|CLOTH|STONEBLOCK)(_LEVEL\d)?(@\d)?$/;

/** Journal fame one craft gives, before the player's premium bonus (which never reaches journals):
 * refined resources x fame per resource x the item's own journal-fame factor (1.1-1.4 for artifact
 * gear, 1 otherwise). Independent of focus, return rate and quality -- fame is per craft, on the
 * recipe's full material count. */
export function journalFamePerCraft(tier: number, enchant: number, materials: { itemId: string; count: number }[], fameFactor: number): number {
  const resources = materials.filter((m) => REFINED_RESOURCE.test(m.itemId)).reduce((sum, m) => sum + m.count, 0);
  return resources * famePerResource(tier, enchant) * fameFactor;
}
