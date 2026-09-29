import { BLACK_MARKET, REAL_CITIES } from "@/lib/aodp/cities";
import { getCitySpecialty } from "@/lib/city-specialties";
import { robustStat, type CityQuote } from "@/lib/formulas/outliers";
import { saleTaxRate } from "@/lib/formulas/market-tax";
import { BREEDING_FEED_ITEMS, BREEDING_MEAT_ITEMS, breedingCostSilver, breedingPriceInputs } from "@/lib/formulas/breeding";
import { craftingFeePerBatch } from "@/lib/formulas/station-fee";
import { focusPerCraft } from "@/lib/formulas/focus-cost";
import { siteBonus, siteReturnRate, type CraftSite } from "@/lib/formulas/craft-site";
import { recipeJournal } from "@/lib/journals";
import type { CityPricePoint } from "@/lib/recipe-math";
import type { Recipe } from "@/lib/db/schema";

/** Everything the player controls in the crafting calculator. Also what a saved plan stores.
 * `breedOwnMount` is undefined on plans saved before this existed -- reads as falsy, same as false.
 * `journals` likewise, but reads as ON: the journal profit is part of the real number, and the
 * ranking includes it by default too. */
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
  journals?: boolean;
  /** Where the crafting happens. Undefined (every plan saved before hideouts) is a royal city,
   * `craftCity`. A hideout sets the return bonus; `craftCity` then stays as it was. */
  site?: CraftSite;
};

/** The plan's own assumptions with every hand-typed price dropped, so the result follows the
 * market: what a saved plan's "today" figure and its Discord alert are computed with. A typed sell
 * or material price is a snapshot of one moment; frozen into an alert it would never react to the
 * very prices the alert exists to watch. */
export function marketPricedParams(p: CraftParams): CraftParams {
  return { ...p, sellOverride: null, matOverrides: {} };
}

/** True when the plan carries a hand-typed price that `marketPricedParams` drops. */
export function hasPriceOverrides(p: CraftParams): boolean {
  return p.sellOverride !== null || Object.keys(p.matOverrides ?? {}).length > 0;
}

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

/** Best standing buy order for an item across the real cities -- what selling it instantly (matching
 * the order instead of publishing a sell listing and waiting) actually pays. A buy order escrows its
 * silver up front, so unlike a sell listing it can't be a bait price: no outlier trimming needed. */
function bestInstantSellPrice(market: Record<string, CityPricePoint[]>, itemId: string, quality: number): { value: number | null; city: string | null } {
  let best: { value: number; city: string } | null = null;
  for (const pt of market[itemId] ?? []) {
    if (pt.quality === quality && (REAL_CITIES as readonly string[]).includes(pt.city) && pt.buyPriceMax !== null && (!best || pt.buyPriceMax > best.value))
      best = { value: pt.buyPriceMax, city: pt.city };
  }
  return best ?? { value: null, city: null };
}

/** One item's crafting result under the given assumptions -- shared by the calculator (browser)
 * and the alert checker (ingest), so both always agree on the number. `fce` is the player's
 * Destiny Board focus cost efficiency for this item (src/lib/destiny-focus.ts); it only changes the
 * focus figures, never the silver ones, so it isn't part of a saved plan. */
export function computeCraft(recipe: Recipe, market: Record<string, CityPricePoint[]>, p: CraftParams, fce = 0) {
  const spec = getCitySpecialty(recipe.craftingCategory);
  const inCity = !p.site || p.site.kind === "city";
  const specActive = inCity && spec !== null && spec.city === p.craftCity;
  const site = siteBonus(p.site, recipe, p.craftCity);
  const rrr = siteReturnRate(site.bonus, p.focus);

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
    // Artifacts, plus whatever the recipe marks as never returned (@maxreturnamount="0").
    const noReturn = m.category === "artifact" || m.noReturn === true;
    return { m, price, auto: stat.value, cheapest, noReturn, bred: breedCost !== null, effective: m.count * (1 - (noReturn ? 0 : rrr)) };
  });

  // Only weapons and armor trade at the Black Market; potions, food, refined goods and mounts don't.
  const useBlackMarket = p.blackMarket && recipe.stationType === "gear";
  const sellPoints = (market[recipe.itemId] ?? []).filter(
    (pt) => pt.quality === p.quality && pt.price !== null && (useBlackMarket ? pt.city === BLACK_MARKET : pt.city !== BLACK_MARKET),
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
  // Informational only, never feeds sellPrice: Black Market's own "price" is already a buy-order
  // value (see computeCityPrice), so this fallback only applies to the real-city path.
  const sellInstant = !useBlackMarket && sellStat.value === null ? bestInstantSellPrice(market, recipe.itemId, p.quality) : { value: null, city: null };
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
  const taxRate = saleTaxRate(p.premium);

  // Equipo: the labourer journal the crafts fill -- empties bought at the cheapest city, sold full
  // at the median listing, taxed like the item (see src/lib/journals.ts).
  const journalInfo = recipeJournal(recipe);
  const journal = journalInfo
    ? (() => {
        const quotes = (itemId: string) =>
          (market[itemId] ?? [])
            .filter((pt) => pt.quality === 1 && pt.price !== null && pt.city !== BLACK_MARKET)
            .map((pt): CityQuote => ({ city: pt.city, price: pt.price!, selfRef: pt.weightedAvgPrice30d }));
        const empty = robustStat(quotes(journalInfo.emptyItemId), "min");
        const full = robustStat(quotes(journalInfo.fullItemId), "median");
        const count = journalInfo.journalsPerUnit * produced;
        const priced = empty.value !== null && full.value !== null;
        const included = p.journals !== false && priced;
        return {
          ...journalInfo,
          count,
          fame: journalInfo.famePerCraft * crafts,
          emptyPrice: empty.value,
          emptyCity: empty.result.kept.find((q) => q.price === empty.value)?.city ?? null,
          fullPrice: full.value,
          priced,
          included,
          cost: included ? count * empty.value! : 0,
          gross: included ? count * full.value! : 0,
        };
      })()
    : null;
  const journalCost = journal?.cost ?? 0;
  const journalGross = journal?.gross ?? 0;

  const cost = materialsTotal + feeTotal + journalCost + p.extraCost;
  const gross = sellPrice * produced;
  const revenue = (gross + journalGross) * (1 - taxRate);
  const profit = revenue - cost;

  return {
    spec,
    specActive,
    /** Production bonus of the chosen site before focus, and whether a site specialty applies. */
    siteBonus: site.bonus,
    siteSpecialty: site.specialty,
    rrr,
    materials,
    sellPrice,
    sellAuto: sellStat.value,
    sellInstantPrice: sellInstant.value,
    sellInstantCity: sellInstant.city,
    sellBreakdown,
    sellCities: sellStat.result.kept.length,
    oldestAge: ages.length ? Math.max(...ages) : null,
    volume,
    crafts,
    produced,
    feePerCraft,
    materialsTotal,
    feeTotal,
    journal,
    cost,
    taxRate,
    gross,
    revenue,
    profit,
    margin: cost > 0 ? profit / cost : null,
    perUnit: produced > 0 ? profit / produced : 0,
    /** Focus per craft with the player's board, unrounded (the game rounds the order's total).
     * items.json's @craftingfocus is per unit produced, not per craft: a T4 poison craft (5 potions,
     * @craftingfocus 84) costs 5 x 84 x 0.553 = 232 with a real player's board, as the game showed. */
    focusPerCraft: focusPerCraft(recipe.craftingFocus * recipe.batchSize, fce),
    focusTotal: p.focus ? Math.round(focusPerCraft(recipe.craftingFocus * recipe.batchSize, fce) * crafts) : 0,
    /** True when the profit figure rests on a missing price (materials counted as 0 or no sell price). */
    incomplete:
      materials.some((x) => x.auto === null && p.matOverrides[x.m.itemId] === undefined) ||
      (sellStat.value === null && p.sellOverride === null),
    unpriced: materials.filter((x) => x.auto === null && p.matOverrides[x.m.itemId] === undefined).length,
  };
}
