import poolsJson from "@/data/generated/artifact-pools.json";
import type { ArtifactClass, FragmentKind } from "@/lib/artifact-roll";

export { CLASS_LABEL, MIXED_FRAGMENT_COUNT, computeRoll, type ArtifactClass, type FragmentKind, type RollResult } from "@/lib/artifact-roll";

export type ArtifactPool = {
  fragment: FragmentKind;
  fragmentId: string;
  tier: number;
  /** Fragments per roll when a class is picked (the mixed pool costs MIXED_FRAGMENT_COUNT). */
  fragmentCount: number;
  artifacts: { itemId: string; nameEs: string; class: ArtifactClass }[];
};

export const ARTIFACT_POOLS = poolsJson as ArtifactPool[];

export const ARTIFACT_MARKET_ITEMS: string[] = [
  ...new Set(ARTIFACT_POOLS.flatMap((p) => [p.fragmentId, ...p.artifacts.map((a) => a.itemId)])),
];
