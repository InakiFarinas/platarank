import { unstable_cache } from "next/cache";
import type { RecipeRow, CityPricePoint } from "@/lib/recipe-math";
import { recipeMarketItemIds, loadMarketFor, loadRankSnapshot, stationMarketItemIds, type StationData, type StationType } from "@/lib/server/station-data";
import { loadTopRecipes, type TopRecipe } from "@/lib/server/top-recipes";
import { recipeById, recipesOfStation } from "@/lib/recipes-data";
import { loadArtifactPools, type ArtifactPoolView } from "@/lib/server/artifact-data";

// Supabase egress is 5 GB/month on the free plan, and every serverless instance, every locale's ISR
// render and every deploy used to read the same market rows on its own. These wrappers keep one copy
// per hour in Next's data cache instead (shared by every instance and locale on Vercel, and kept
// across deploys), so a given slice of the market leaves Supabase at most once an hour. Prices only
// change on the hourly ingest, so an hour-old copy is as fresh as the ISR pages already are.
// Web-only: unstable_cache needs the Next runtime, so the ingester keeps calling station-data directly.
const HOUR = 3600;

// Vercel's data cache skips entries over 2 MB, so the market is stored as compact tuples and gear's
// ~73k price points (~3.5 MB that way) are split into shards.
type PackedPoint = [city: string, quality: number, price: number | null, age: number | null, buyMax: number | null, volume: number, days: number, wavg: number | null];
type PackedMarket = Record<string, PackedPoint[]>;

function pack(market: Record<string, CityPricePoint[]>): PackedMarket {
  const out: PackedMarket = {};
  for (const [id, points] of Object.entries(market)) {
    out[id] = points.map((p) => [p.city, p.quality, p.price, p.priceAgeSeconds, p.buyPriceMax, p.avgDailyVolume30d, p.daysWithVolume30d, p.weightedAvgPrice30d]);
  }
  return out;
}

function unpackInto(target: Record<string, CityPricePoint[]>, packed: PackedMarket) {
  for (const [id, points] of Object.entries(packed)) {
    target[id] = points.map(([city, quality, price, priceAgeSeconds, buyPriceMax, avgDailyVolume30d, daysWithVolume30d, weightedAvgPrice30d]) => ({
      city,
      quality,
      price,
      priceAgeSeconds,
      buyPriceMax,
      avgDailyVolume30d,
      daysWithVolume30d,
      weightedAvgPrice30d,
    }));
  }
}

/** Short stable hash, so a shard's cache key changes whenever its item list does (a deploy with new
 * recipes) instead of serving a shard cached for a different list. */
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const SHARDS: Partial<Record<StationType, number>> = { gear: 8 };

function stationShards(stationType: StationType): string[][] {
  const ids = [...stationMarketItemIds(stationType)].sort();
  const n = SHARDS[stationType] ?? 1;
  const size = Math.ceil(ids.length / n);
  return Array.from({ length: n }, (_, i) => ids.slice(i * size, (i + 1) * size)).filter((c) => c.length > 0);
}

// The item list is rebuilt inside from (station, index): passing it as an argument would put
// thousands of ids into the cache key. The list's hash is an argument only so it lands in the key.
const loadShard = unstable_cache(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (stationType: StationType, index: number, _listHash: string): Promise<PackedMarket> => pack(await loadMarketFor(stationShards(stationType)[index] ?? [])),
  ["station-market-shard-v1"],
  { revalidate: HOUR, tags: ["market"] },
);

async function loadStationMarket(stationType: StationType): Promise<Record<string, CityPricePoint[]>> {
  const shards = stationShards(stationType);
  const parts = await Promise.all(shards.map((ids, i) => loadShard(stationType, i, hash(ids.join(",")))));
  const market: Record<string, CityPricePoint[]> = {};
  for (const part of parts) unpackInto(market, part);
  return market;
}

/** A station's recipes and market data, for the ranking pages. */
export async function loadStationDataShared(stationType: StationType): Promise<StationData> {
  return { recipes: recipesOfStation(stationType), marketByItem: await loadStationMarket(stationType) };
}

// /api/rank recomputes gear on every changed filter. On top of the shared cache, a warm instance
// keeps the unpacked data in memory for a few minutes so it doesn't re-download and unpack ~3.5 MB
// per request.
const MEMO_TTL_MS = 10 * 60 * 1000;
const memo = new Map<StationType, { at: number; data: Promise<StationData> }>();

export function loadStationDataMemo(stationType: StationType): Promise<StationData> {
  const hit = memo.get(stationType);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.data;
  const data = loadStationDataShared(stationType);
  memo.set(stationType, { at: Date.now(), data });
  data.catch(() => memo.delete(stationType));
  return data;
}

const loadItemMarket = unstable_cache(
  async (itemId: string): Promise<PackedMarket> => {
    const recipe = recipeById(itemId);
    return recipe ? pack(await loadMarketFor(recipeMarketItemIds(recipe))) : {};
  },
  ["item-market-v1"],
  { revalidate: HOUR, tags: ["market"] },
);

/** Market points for one recipe (itself, its materials and extras), shared across locales and the
 * calculator. */
export async function loadItemMarketShared(itemId: string): Promise<Record<string, CityPricePoint[]>> {
  const market: Record<string, CityPricePoint[]> = {};
  unpackInto(market, await loadItemMarket(itemId));
  return market;
}

/** The gear ranking snapshot (~0.8 MB), read once an hour instead of once per locale render. */
export const loadRankSnapshotShared: (stationType: StationType) => Promise<{ rows: RecipeRow[]; total: number } | null> = unstable_cache(
  (stationType: StationType) => loadRankSnapshot(stationType),
  ["rank-snapshot-v1"],
  { revalidate: HOUR, tags: ["market"] },
);

export const loadTopRecipesShared: (limit?: number) => Promise<TopRecipe[]> = unstable_cache((limit = 5) => loadTopRecipes(limit), ["top-recipes-v1"], {
  revalidate: HOUR,
  tags: ["market"],
});

/** The Foundry pools, already reduced to a few KB: one read an hour for every locale. */
export const loadArtifactPoolsShared: () => Promise<ArtifactPoolView[]> = unstable_cache(() => loadArtifactPools(), ["artifact-pools-v1"], {
  revalidate: HOUR,
  tags: ["market"],
});
