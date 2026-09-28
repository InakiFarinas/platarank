import destinyJson from "@/data/generated/destiny-focus.json";
import type { Locale } from "@/i18n/config";

type Bonus = { fcePerLevel: number; minTier: number; maxTier: number; patterns: string[] };
type Node = { id: string; kind: "mastery" | "spec"; nameEs: string; nameEn: string; namePt: string; maxLevel: number; bonuses: Bonus[] };
const NODES = (destinyJson as { nodes: Node[] }).nodes;

/** The player's Destiny Board levels, by node id. Missing = 0. */
export type DestinyLevels = Record<string, number>;

export type RelevantNode = { id: string; kind: "mastery" | "spec"; name: string; maxLevel: number; fcePerLevel: number };

const regexCache = new Map<string, RegExp>();
/** Destiny Board item patterns: "T?" is any tier, a trailing "*" any suffix (enchanted refined
 * resources, artifact variants...). Matched against the recipe's base item id. */
function patternRegex(pattern: string): RegExp {
  let re = regexCache.get(pattern);
  if (!re) {
    re = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\?/g, "\\d+").replace(/\*/g, ".*")}$`);
    regexCache.set(pattern, re);
  }
  return re;
}

/** Every Destiny Board node that lowers this recipe's focus cost, with the FCE each of its levels
 * adds to it: the category mastery first, then the specs by weight (the item's own spec, 250 per
 * level, before its siblings' 30/22.5/15/11.25 and the crystal specs' ~2 tree bonus). Empty for
 * items no node covers (mounts). */
export function relevantNodes(recipe: { baseItemId: string; tier: number }, locale: Locale): RelevantNode[] {
  const out: RelevantNode[] = [];
  for (const node of NODES) {
    let fcePerLevel = 0;
    for (const b of node.bonuses) {
      if (recipe.tier < b.minTier || recipe.tier > b.maxTier) continue;
      if (b.patterns.some((p) => patternRegex(p).test(recipe.baseItemId))) fcePerLevel += b.fcePerLevel;
    }
    if (fcePerLevel > 0) {
      out.push({ id: node.id, kind: node.kind, name: locale === "en" ? node.nameEn : locale === "pt" ? node.namePt : node.nameEs, maxLevel: node.maxLevel, fcePerLevel });
    }
  }
  return out.sort((a, b) => (a.kind === b.kind ? b.fcePerLevel - a.fcePerLevel || a.name.localeCompare(b.name) : a.kind === "mastery" ? -1 : 1));
}

/** The recipe's focus cost efficiency for these levels: the sum of level x FCE-per-level over the
 * nodes that cover it. Levels are clamped to 0..maxLevel. */
export function recipeFce(nodes: RelevantNode[], levels: DestinyLevels): number {
  return nodes.reduce((sum, n) => sum + Math.min(n.maxLevel, Math.max(0, levels[n.id] ?? 0)) * n.fcePerLevel, 0);
}
