import { BLACK_MARKET } from "@/lib/aodp/cities";
import { getCitySpecialty } from "@/lib/city-specialties";
import { robustStat, type CityQuote } from "@/lib/formulas/outliers";
import { saleTaxRate } from "@/lib/formulas/market-tax";
import { BREEDING_FEED_ITEMS, BREEDING_MEAT_ITEMS, breedingCostSilver, breedingPriceInputs } from "@/lib/formulas/breeding";
import { craftingFeePerBatch } from "@/lib/formulas/station-fee";
import { returnRate } from "@/lib/formulas/return-rate";
import type { CityPricePoint } from "@/lib/recipe-math";
import type { Recipe } from "@/lib/db/schema";

/** Everything the player controls in the crafting calculator. Also what a saved plan stores.
 * `breedOwnMount` is undefined on plans saved before this existed -- reads as falsy, same as false. */
export type CraftParams = {
  qty: number;
  premium: boolean;
  blackMarket: boolean;
  quality: number;
  craftCity: string;
  focus: boolean;
  feeRate: number;
  extraCost: number;
  sellOverride: number | null;
  matOverrides: Record<string, number>;
  breedOwnMount?: boolean;
};

/** Cheapest quote for any of the given items, royal cities only -- same as every other material
 * price in the calculator (Black Market has no sell orders to buy against). Used for breeding's
 * feed pools (any tier-equivalent crop or cut of meat feeds the same) and for a baby animal that
 * trades on the market instead of a fixed NPC price (a single-item list there). */
function cheapestMarketPrice(market: Record<string, CityPricePoint[]>, itemIds: readonly string[]): number | null {
  const quotes: CityQuote[] = [];
  for (const itemId of itemIds) {
    for (const pt of market[itemId] ?? []) {
      if (pt.quality === 1 && pt.price !== null && pt.city !== BLACK_MARKET)
        quotes.push({ city: pt.city, price: pt.price, selfRef: pt.weightedAvgPrice30d });
    }
  }
  return robustStat(quotes, "min").value;
}

/** One item's crafting result under the given assumptions -- shared by the calculator (browser)
 * and the alert checker (ingest), so both always agree on the number. */
export function computeCraft(recipe: Recipe, market: Record<string, CityPricePoint[]>, p: CraftParams) {
  const spec = getCitySpecialty(recipe.craftingCategory);
  const specActive = spec !== null && spec.city === p.craftCity;
  const rrr = returnRate({
    cityCraftingSpecialty: specActive && spec!.kind === "crafting",
    cityRefiningSpecialty: specActive && spec!.kind === "refining",
    focus: p.focus,
  });

  const feedPriceCache = new Map<"plants" | "meat", number | null>();
  const cheapestFeedPrice = (category: "plants" | "meat") => {
    if (!feedPriceCache.has(category)) {
      feedPriceCache.set(category, cheapestMarketPrice(market, category === "meat" ? BREEDING_MEAT_ITEMS : BREEDING_FEED_ITEMS));
    }
    return feedPriceCache.get(category)!;
  };

  const materials = recipe.materials.map((m) => {
    const breeding = p.breedOwnMount ? breedingPriceInputs(m.itemId) : null;
    const breedCost = breeding
      ? breedingCostSilver(
          m.itemId,
          breeding.babyItemId !== null ? cheapestMarketPrice(market, [breeding.babyItemId]) : null,
          cheapestFeedPrice(breeding.feedItems === BREEDING_MEAT_ITEMS ? "meat" : "plants"),
        )
      : null;

    let stat: ReturnType<typeof robustStat>;
    let cheapest: string | null;
    if (breedCost !== null) {
      stat = { value: breedCost, result: { kept: [], discarded: [] } };
      cheapest = null;
    } else {
      const points = (market[m.itemId] ?? []).filter((pt) => pt.quality === 1 && pt.price !== null && pt.city !== BLACK_MARKET);
      const quotes: CityQuote[] = points.map((pt) => ({ city: pt.city, price: pt.price!, selfRef: pt.weightedAvgPrice30d }));
      stat = robustStat(quotes, "min");
      cheapest = stat.result.kept.find((q) => q.price === stat.value)?.city ?? null;
    }
    const price = p.matOverrides[m.itemId] ?? stat.value ?? 0;
    const noReturn = m.category === "artifact";
    return { m, price, auto: stat.value, cheapest, noReturn, bred: breedCost !== null, effective: m.count * (1 - (noReturn ? 0 : rrr)) };
  });

  const sellPoints = (market[recipe.itemId] ?? []).filter(
    (pt) => pt.quality === p.quality && pt.price !== null && (p.blackMarket ? pt.city === BLACK_MARKET : pt.city !== BLACK_MARKET),
  );
  const sellStat = robustStat(
    sellPoints.map((pt) => ({ city: pt.city, price: pt.price!, selfRef: pt.weightedAvgPrice30d })),
    "median",
  );
  const discardedByCity = new Map(sellStat.result.discarded.map((d) => [d.city, d.reason]));
  const sellBreakdown = sellPoints
    .map((pt) => ({
      city: pt.city,
      price: pt.price!,
      ageSeconds: pt.priceAgeSeconds,
      volume: pt.avgDailyVolume30d,
      discarded: discardedByCity.get(pt.city) ?? null,
    }))
    .sort((a, b) => a.price - b.price);
  const sellPrice = p.sellOverride ?? sellStat.value ?? 0;
  // Only the cities whose price actually fed `sellStat` may lend their volume to it -- a city with
  // real daily volume but no live price (or a discarded bait listing) must not inflate plata/día
  // through a price that isn't its own (see outliers.ts's outlier_self note).
  const keptSellCities = new Set(sellStat.result.kept.map((q) => q.city));
  const keptSellPoints = sellPoints.filter((pt) => keptSellCities.has(pt.city));
  const ages = keptSellPoints.map((pt) => pt.priceAgeSeconds).filter((a): a is number => a !== null);
  const volume = keptSellPoints.reduce((s, pt) => s + pt.avgDailyVolume30d, 0);

  const crafts = Math.ceil(p.qty / recipe.batchSize);
  const produced = crafts * recipe.batchSize;
  const feePerCraft = craftingFeePerBatch(Number(recipe.materialItemValue), p.feeRate);
  const materialsTotal = materials.reduce((s, x) => s + x.price * x.effective, 0) * crafts;
  const feeTotal = feePerCraft * crafts;
  const cost = materialsTotal + feeTotal + p.extraCost;
  const taxRate = saleTaxRate(p.premium);
  const gross = sellPrice * produced;
  const revenue = gross * (1 - taxRate);
  const profit = revenue - cost;

  return {
    spec,
    specActive,
    rrr,
    materials,
    sellPrice,
    sellAuto: sellStat.value,
    sellBreakdown,
    sellCities: sellStat.result.kept.length,
    oldestAge: ages.length ? Math.max(...ages) : null,
    volume,
    crafts,
    produced,
    feePerCraft,
    materialsTotal,
    feeTotal,
    cost,
    taxRate,
    gross,
    revenue,
    profit,
    margin: cost > 0 ? profit / cost : null,
    perUnit: produced > 0 ? profit / produced : 0,
    focusTotal: p.focus ? recipe.craftingFocus * crafts : 0,
    /** True when the profit figure rests on a missing price (materials counted as 0 or no sell price). */
    incomplete:
      materials.some((x) => x.auto === null && p.matOverrides[x.m.itemId] === undefined) ||
      (sellStat.value === null && p.sellOverride === null),
    unpriced: materials.filter((x) => x.auto === null && p.matOverrides[x.m.itemId] === undefined).length,
  };
}
