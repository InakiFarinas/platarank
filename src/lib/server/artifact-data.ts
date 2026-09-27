import { loadMarketFor } from "@/lib/server/station-data";
import { cheapestMarketPrice, computeSingleQualitySellSide, DEFAULT_PARAMS } from "@/lib/recipe-math";
import { ARTIFACT_MARKET_ITEMS, ARTIFACT_POOLS } from "@/lib/artifacts";
import type { ArtifactClass, FragmentKind } from "@/lib/artifact-roll";

export type ArtifactPoolView = {
  fragment: FragmentKind;
  tier: number;
  fragmentCount: number;
  /** Cheapest fragment quote across the real cities. */
  fragmentPrice: number | null;
  /** City where that cheapest fragment quote is, null when there is no price. */
  fragmentCity: string | null;
  artifacts: { itemId: string; nameEs: string; nameEn: string; class: ArtifactClass; gross: number | null; dailyVolume: number }[];
};

/** Prices for every Foundry pool, reduced server-side to one buy price per fragment and one sell
 * price per artifact so the browser only gets a few KB. */
export async function loadArtifactPools(): Promise<ArtifactPoolView[]> {
  const market = new Map(Object.entries(await loadMarketFor(new Set(ARTIFACT_MARKET_ITEMS))));
  return ARTIFACT_POOLS.map((pool) => {
    const fragmentPrice = cheapestMarketPrice(market, DEFAULT_PARAMS.buyCities, [pool.fragmentId]);
    const fragmentCity =
      fragmentPrice === null
        ? null
        : (market.get(pool.fragmentId)?.find((p) => p.quality === 1 && p.price === fragmentPrice && DEFAULT_PARAMS.buyCities.includes(p.city as never))?.city ?? null);
      return {
      fragment: pool.fragment,
      tier: pool.tier,
      fragmentCount: pool.fragmentCount,
      fragmentPrice,
      fragmentCity,
      artifacts: pool.artifacts.map((a) => {
        const side = computeSingleQualitySellSide(a.itemId, market, DEFAULT_PARAMS);
        // A listing with no real sales (fewer than 3 trading days) is not a price you can sell at, same
        // liquidity bar as the gear ranking: leave it out of the average instead of inflating it.
        return { ...a, gross: side.avgDailyVolume30d > 0 ? side.sellRefPriceGross : null, dailyVolume: side.avgDailyVolume30d };
      }),
    };
  });
}
