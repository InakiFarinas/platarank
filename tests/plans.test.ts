import { describe, expect, test } from "vitest";
import { computeCraft, hasPriceOverrides, marketPricedParams, type CraftParams } from "@/lib/craft-calc";
import type { CityPricePoint } from "@/lib/recipe-math";
import type { Recipe } from "@/lib/db/schema";

const potion: Recipe = {
  itemId: "T6_POTION_HEAL",
  baseItemId: "T6_POTION_HEAL",
  nameEs: "Poción de curación mayor",
  nameEn: "Major Healing Potion",
  tier: 6,
  enchant: 0,
  stationType: "alchemy",
  craftingCategory: "potion",
  maxQualityLevel: 1,
  batchSize: 5,
  craftingFocus: 0,
  materials: [{ itemId: "T6_FOXGLOVE", count: 72, category: "farm", nameEs: "Dedalera", nameEn: "Foxglove" }],
  materialItemValue: "2880",
};

function point(city: string, price: number): CityPricePoint {
  return { city, quality: 1, price, priceAgeSeconds: 3600, buyPriceMax: null, avgDailyVolume30d: 100, daysWithVolume30d: 30, weightedAvgPrice30d: price };
}

const params: CraftParams = {
  qty: 5,
  premium: true,
  blackMarket: false,
  quality: 1,
  craftCity: "Caerleon",
  focus: false,
  feeRate: 500,
  extraCost: 0,
  sellOverride: 50000,
  matOverrides: { T6_FOXGLOVE: 1 },
};

describe("planificaciones con precios de hoy", () => {
  test("marketPricedParams descarta los precios escritos a mano y conserva el resto", () => {
    const p = marketPricedParams(params);
    expect(p.sellOverride).toBeNull();
    expect(p.matOverrides).toEqual({});
    expect(p.qty).toBe(5);
    expect(p.craftCity).toBe("Caerleon");
    expect(hasPriceOverrides(params)).toBe(true);
    expect(hasPriceOverrides(p)).toBe(false);
  });

  test("la ganancia de hoy (y la del aviso) sigue al mercado aunque el plan tenga precios a mano", () => {
    const cheap = { T6_POTION_HEAL: [point("Caerleon", 1000)], T6_FOXGLOVE: [point("Caerleon", 100)] };
    const dear = { T6_POTION_HEAL: [point("Caerleon", 9000)], T6_FOXGLOVE: [point("Caerleon", 100)] };
    // Con los precios a mano, el mercado no cambia nada: por eso el aviso no los usa.
    expect(computeCraft(potion, cheap, params).profit).toBe(computeCraft(potion, dear, params).profit);
    expect(computeCraft(potion, dear, marketPricedParams(params)).profit).toBeGreaterThan(
      computeCraft(potion, cheap, marketPricedParams(params)).profit,
    );
  });
});
