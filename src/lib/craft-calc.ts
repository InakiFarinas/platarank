import { BLACK_MARKET } from "@/lib/aodp/cities";
import { getCitySpecialty } from "@/lib/city-specialties";
import { robustStat, type CityQuote } from "@/lib/formulas/outliers";
import { craftingFeePerBatch } from "@/lib/formulas/station-fee";
import { returnRate } from "@/lib/formulas/return-rate";
import type { CityPricePoint } from "@/lib/recipe-math";
import type { Recipe } from "@/lib/db/schema";

const SETUP_FEE = 0.025;

/** Everything the player controls in the crafting calculator. Also what a saved plan stores. */
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
};

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

  const materials = recipe.materials.map((m) => {
    const points = (market[m.itemId] ?? []).filter((pt) => pt.quality === 1 && pt.price !== null && pt.city !== BLACK_MARKET);
    const quotes: CityQuote[] = points.map((pt) => ({ city: pt.city, price: pt.price! }));
    const stat = robustStat(quotes, "min");
    const cheapest = stat.result.kept.find((q) => q.price === stat.value)?.city ?? null;
    const price = p.matOverrides[m.itemId] ?? stat.value ?? 0;
    const noReturn = m.category === "artifact";
    return { m, price, auto: stat.value, cheapest, noReturn, effective: m.count * (1 - (noReturn ? 0 : rrr)) };
  });

  const sellPoints = (market[recipe.itemId] ?? []).filter(
    (pt) => pt.quality === p.quality && pt.price !== null && (p.blackMarket ? pt.city === BLACK_MARKET : pt.city !== BLACK_MARKET),
  );
  const sellStat = robustStat(sellPoints.map((pt) => ({ city: pt.city, price: pt.price! })), "median");
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
  const ages = sellPoints.map((pt) => pt.priceAgeSeconds).filter((a): a is number => a !== null);
  const volume = sellPoints.reduce((s, pt) => s + pt.avgDailyVolume30d, 0);

  const crafts = Math.ceil(p.qty / recipe.batchSize);
  const produced = crafts * recipe.batchSize;
  const feePerCraft = craftingFeePerBatch(Number(recipe.materialItemValue), p.feeRate);
  const materialsTotal = materials.reduce((s, x) => s + x.price * x.effective, 0) * crafts;
  const feeTotal = feePerCraft * crafts;
  const cost = materialsTotal + feeTotal + p.extraCost;
  const taxRate = (p.premium ? 0.04 : 0.08) + SETUP_FEE;
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
