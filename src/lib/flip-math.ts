import { robustStat, type CityQuote } from "@/lib/formulas/outliers";
import { netSellMultiplier, netInstantSellMultiplier } from "@/lib/formulas/market-tax";
import { isLiquid } from "@/lib/formulas/liquidity";
import { oldestAge, type CityPricePoint, type MarketData } from "@/lib/recipe-math";
import { BLACK_MARKET, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import type { FlipItem } from "@/lib/flip-items";

export type FlipParams = {
  /** Where the player buys. Black Market has no sell listings to match -- only real cities work. */
  buyCities: Location[];
  /** Where the player sells, either by matching the standing buy order instantly or by publishing
   * their own sell order. Black Market is a valid destination (its only listing type IS a buy
   * order), same convention `RecipeMathParams.sellCities` already uses for gear. */
  sellCities: Location[];
  /** 0-1. Fraction of the smaller side's (buy or sell) daily volume the player assumes they can
   * capture -- same semantics as crafting's `marketShare`. */
  marketShare: number;
  /** How the buy leg is allowed to fill: "auto" picks whichever of the two is cheaper per city
   * (the default), "instant" forces matching an existing sell order right now, "order" forces
   * placing your own buy order and waiting. A player who doesn't want to sit on a buy order can
   * pin it to "instant"; one who always undercuts can pin it to "order". */
  buyMethodPref: "auto" | "instant" | "order";
};

export const DEFAULT_FLIP_PARAMS: FlipParams = {
  buyCities: [...REAL_CITIES],
  sellCities: [...REAL_CITIES, BLACK_MARKET],
  marketShare: 0.1,
  buyMethodPref: "auto",
};

export type FlipRow = {
  item: FlipItem;
  hasData: boolean;
  buyCity: string | null;
  buyPrice: number | null;
  /** Which quote won the buy leg -- "instant" (match the cheapest standing sell order right now) or
   * "order" (place your own buy order and wait for a seller to fill it, at the best standing buy
   * order price). Buying never pays tax or a setup fee either way, so the cheaper one always wins. */
  buyMethod: "instant" | "order" | null;
  buyAgeSeconds: number | null;
  sellCity: string | null;
  /** The raw quote before tax: the city's sell-listing price, or its best standing buy order. */
  sellPriceGross: number | null;
  /** Which quote won the sell leg -- "listing" (publish your own order, waits to fill) or
   * "instant" (match the standing buy order right now). Shown so the row is honest about which one
   * it assumed. */
  sellMethod: "listing" | "instant" | null;
  sellAgeSeconds: number | null;
  sellNet: number | null;
  marginPerUnit: number | null;
  marginPct: number | null;
  /** min(buy-city volume, sell-city volume): a flip is bottlenecked on both ends, not just the
   * destination's absorption -- see /impeccable plan 2026-10 on why this differs from crafting's
   * own convention (material volume never caps crafting's plata/día). */
  avgDailyVolume30d: number;
  marketSharePct: number;
  platinumPerDay: number | null;
  discarded: { city: string; price: number; reason: string }[];
};

export type FlipSortKey = "margin" | "marginPct" | "volume" | "buyPrice" | "sellPrice" | "platinumPerDay";

export const FLIP_SORT_ACCESSORS: Record<FlipSortKey, (r: FlipRow) => number> = {
  margin: (r) => r.marginPerUnit ?? -Infinity,
  marginPct: (r) => r.marginPct ?? -Infinity,
  volume: (r) => r.avgDailyVolume30d,
  buyPrice: (r) => r.buyPrice ?? -Infinity,
  sellPrice: (r) => r.sellPriceGross ?? -Infinity,
  platinumPerDay: (r) => r.platinumPerDay ?? -Infinity,
};

/** A margin this wide between real cities is almost always a bad quote (a stale price, a one-off
 * troll listing that slipped past the liquidity gate) rather than a real opportunity -- same idea
 * as crafting's own sanity ceiling (top-recipes.ts), just tighter, since cross-city arbitrage
 * margins run thinner than crafting margins in practice. Rows above this are still shown (never
 * hidden), just excluded from what counts as "the top" for the default sort/snapshot. */
export const SANE_MARGIN_CEILING = 0.8;

function buyLeg(item: FlipItem, points: CityPricePoint[], buyCities: Location[], methodPref: FlipParams["buyMethodPref"]) {
  const quotes: (CityQuote & { age: number | null; method: "instant" | "order" })[] = [];
  for (const p of points) {
    if (p.quality !== 1 || !buyCities.includes(p.city as Location) || !isLiquid(p)) continue;
    // Buying never pays tax or a setup fee in Albion -- whether you instant-buy against an existing
    // sell order (`price`) or place your own buy order and wait for a seller to fill it
    // (`buyPriceMax`, the same "best standing buy order" field the sell leg's instant-sell method
    // reads). No multiplier needed either way, so "auto" always picks whichever is cheaper; a
    // pinned preference restricts the city to just that one method instead.
    const instant = methodPref !== "order" ? p.price : null;
    const order = methodPref !== "instant" ? p.buyPriceMax : null;
    const useOrder = order !== null && (instant === null || order < instant);
    const price = useOrder ? order : instant;
    if (price === null) continue;
    quotes.push({ city: p.city, price, selfRef: p.weightedAvgPrice30d, age: p.priceAgeSeconds, method: useOrder ? "order" : "instant" });
  }
  const stat = robustStat(quotes, "min");
  if (stat.value === null) return { price: null, city: null, age: null, method: null, discarded: stat.result.discarded };
  const kept = stat.result.kept.find((q) => q.price === stat.value) as (CityQuote & { age: number | null; method: "instant" | "order" }) | undefined;
  return { price: stat.value, city: kept?.city ?? null, age: kept?.age ?? null, method: kept?.method ?? null, discarded: stat.result.discarded };
}

function sellLeg(points: CityPricePoint[], sellCities: Location[]) {
  let best: { net: number; gross: number; city: string; method: "listing" | "instant"; age: number | null; volume: number } | null = null;
  for (const p of points) {
    if (p.quality !== 1 || !sellCities.includes(p.city as Location) || !isLiquid(p)) continue;
    const listingNet = p.price !== null ? p.price * netSellMultiplier() : null;
    const instantNet = p.buyPriceMax !== null ? p.buyPriceMax * netInstantSellMultiplier() : null;
    // Instant-sell has no liquidity gate elsewhere in the app (`bestInstantSellPrice`) because it
    // only ever feeds an informational fallback there. Here it directly drives plata/día, so it
    // gets the same `isLiquid` bar as everything else -- the `continue` above already applies it
    // to both legs since AODP gives one volume signal per item-city, not two.
    const useInstant = (instantNet ?? -Infinity) > (listingNet ?? -Infinity);
    const net = useInstant ? instantNet : listingNet;
    if (net === null || (best && net <= best.net)) continue;
    best = {
      net,
      gross: useInstant ? p.buyPriceMax! : p.price!,
      city: p.city,
      method: useInstant ? "instant" : "listing",
      age: p.priceAgeSeconds,
      volume: p.avgDailyVolume30d,
    };
  }
  return best;
}

export function computeFlipRow(item: FlipItem, market: MarketData, params: FlipParams): FlipRow {
  const points = market.get(item.itemId) ?? [];
  const buy = buyLeg(item, points, params.buyCities, params.buyMethodPref);
  const sell = sellLeg(points, params.sellCities);
  const hasData = buy.price !== null && sell !== null;

  const buyPoint = buy.city !== null ? points.find((p) => p.city === buy.city && p.quality === 1) : undefined;
  const volume = hasData ? Math.min(buyPoint?.avgDailyVolume30d ?? 0, sell!.volume) : 0;
  const marginPerUnit = hasData ? sell!.net - buy.price! : null;
  const marginPct = marginPerUnit !== null && buy.price! > 0 ? marginPerUnit / buy.price! : null;

  return {
    item,
    hasData,
    buyCity: buy.city,
    buyPrice: buy.price,
    buyMethod: buy.method,
    buyAgeSeconds: buy.age ?? oldestAge(points, params.buyCities),
    sellCity: sell?.city ?? null,
    sellPriceGross: sell?.gross ?? null,
    sellMethod: sell?.method ?? null,
    sellAgeSeconds: sell?.age ?? null,
    sellNet: sell?.net ?? null,
    marginPerUnit,
    marginPct,
    avgDailyVolume30d: volume,
    marketSharePct: params.marketShare,
    platinumPerDay: marginPerUnit !== null ? marginPerUnit * volume * params.marketShare : null,
    discarded: buy.discarded,
  };
}
