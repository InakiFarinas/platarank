import { netSellMultiplier } from "@/lib/formulas/market-tax";

/** Artifact Foundry ("meld"): fragments in, one artifact out. Pure and free of the pools JSON, so the
 * client component can import it without shipping every pool a second time (the server already
 * sends the priced pools as props). The data side is src/lib/artifacts.ts. */

export type ArtifactClass = "warrior" | "hunter" | "mage";
export type FragmentKind = "RUNE" | "SOUL" | "RELIC" | "SHARD_AVALONIAN";

/** Fragments for a roll over all three classes at once. Game knowledge, not in the client data dump. */
export const MIXED_FRAGMENT_COUNT = 36;

export const CLASS_LABEL: Record<ArtifactClass, string> = { warrior: "Guerrero", hunter: "Cazador", mage: "Mago" };

export type RollResult = {
  /** Silver spent on the fragments of one roll, null when the fragment has no price. */
  cost: number | null;
  poolSize: number;
  /** How many of the pool's artifacts have a market price (the rest can't be valued). */
  pricedCount: number;
  /** Mean net sale value (after market taxes) of an artifact from the pool. */
  expectedNet: number | null;
  profit: number | null;
  worstNet: number | null;
  bestNet: number | null;
  /** Share of priced artifacts that sell for less than the roll cost. */
  lossShare: number | null;
};

/** Every artifact of the pool has the same chance, so the expected value is the plain mean of their
 * net prices. Unpriced artifacts are left out of the mean (see `pricedCount`) rather than counted
 * as zero, which would fake a loss for items that simply have no listing today. */
export function computeRoll(fragmentPrice: number | null, fragmentCount: number, grossPrices: (number | null)[]): RollResult {
  const net = grossPrices.filter((p): p is number => p !== null).map((p) => p * netSellMultiplier());
  const cost = fragmentPrice !== null ? fragmentPrice * fragmentCount : null;
  const expectedNet = net.length > 0 ? net.reduce((a, b) => a + b, 0) / net.length : null;
  return {
    cost,
    poolSize: grossPrices.length,
    pricedCount: net.length,
    expectedNet,
    profit: cost !== null && expectedNet !== null ? expectedNet - cost : null,
    worstNet: net.length > 0 ? Math.min(...net) : null,
    bestNet: net.length > 0 ? Math.max(...net) : null,
    lossShare: cost !== null && net.length > 0 ? net.filter((n) => n < cost).length / net.length : null,
  };
}
