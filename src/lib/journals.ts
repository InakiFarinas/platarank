import journalsJson from "@/data/generated/journals.json";
import { JOURNAL_TYPES, journalFamePerCraft, type JournalType } from "@/lib/formulas/journal-fame";

type JournalsData = { maxFame: Record<JournalType, Record<string, number>>; byBaseItem: Record<string, [JournalType, number]> };
// JSON imports widen tuples to arrays; the shape is fixed by scripts/fetch-journal-data.ts.
const data = journalsJson as unknown as JournalsData;

export type RecipeJournal = {
  type: JournalType;
  /** Market ids (AODP): the empty journal you buy before crafting, the full one you sell after. */
  emptyItemId: string;
  fullItemId: string;
  famePerCraft: number;
  maxFame: number;
  /** Full journals produced per crafted unit (fame per craft / capacity / batch size). Can exceed 1:
   * a T8.4 craft overflows into several journals. */
  journalsPerUnit: number;
};

/** Which journal crafting this recipe fills, and how much of it. Null when it fills none -- every
 * non-gear station (refining, alchemy, cooking, mounts: the game has no journal for them) and the
 * handful of gear items the dump lists in no journal. */
export function recipeJournal(recipe: {
  baseItemId: string;
  tier: number;
  enchant: number;
  stationType: string;
  batchSize: number;
  materials: { itemId: string; count: number }[];
}): RecipeJournal | null {
  if (recipe.stationType !== "gear") return null;
  const entry = data.byBaseItem[recipe.baseItemId];
  if (!entry) return null;
  const [type, fameFactor] = entry;
  const maxFame = data.maxFame[type]?.[String(recipe.tier)];
  const famePerCraft = journalFamePerCraft(recipe.tier, recipe.enchant, recipe.materials, fameFactor);
  if (!maxFame || famePerCraft <= 0) return null;
  return {
    type,
    emptyItemId: `T${recipe.tier}_JOURNAL_${type}_EMPTY`,
    fullItemId: `T${recipe.tier}_JOURNAL_${type}_FULL`,
    famePerCraft,
    maxFame,
    journalsPerUnit: famePerCraft / maxFame / recipe.batchSize,
  };
}

/** Every journal market id (empty and full, T2-T8, all four types) -- what the ingester prices and
 * what the gear loaders add to the items they read. 56 items at quality 1, so it's cheap. */
export const ALL_JOURNAL_MARKET_ITEMS: readonly string[] = JOURNAL_TYPES.flatMap((type) =>
  [2, 3, 4, 5, 6, 7, 8].flatMap((tier) => [`T${tier}_JOURNAL_${type}_EMPTY`, `T${tier}_JOURNAL_${type}_FULL`]),
);
