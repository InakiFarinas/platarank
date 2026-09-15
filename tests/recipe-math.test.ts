import { describe, expect, test } from "vitest";
import { computeRecipeRow, DEFAULT_PARAMS, type CityPricePoint, type MarketData } from "@/lib/recipe-math";
import type { Recipe } from "@/lib/db/schema";

const recipe: Recipe = {
  itemId: "T6_POTION_HEAL",
  baseItemId: "T6_POTION_HEAL",
  nameEs: "Poción de curación mayor",
  nameEn: "Major Healing Potion",
  tier: 6,
  enchant: 0,
  stationType: "alchemy",
  batchSize: 5,
  craftingFocus: 0,
  materials: [{ itemId: "T6_FOXGLOVE", count: 72, category: "farm", nameEs: "Dedalera", nameEn: "Foxglove" }],
};

function point(city: string, price: number | null, volume = 1000): CityPricePoint {
  return { city, price, priceAgeSeconds: 3600, avgDailyVolume30d: volume, daysWithVolume30d: 30, weightedAvgPrice30d: price };
}

function market(overrides: Record<string, CityPricePoint[]>): MarketData {
  return new Map(Object.entries(overrides));
}

describe("computeRecipeRow", () => {
  test("restringir ciudades de venta reduce el sellRefPrice a solo esas ciudades", () => {
    const data = market({
      T6_POTION_HEAL: [point("Caerleon", 10000), point("Martlock", 20000)],
      T6_FOXGLOVE: [point("Caerleon", 100), point("Martlock", 100)],
    });
    const onlyCaerleon = computeRecipeRow(recipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"] });
    expect(onlyCaerleon.sellRefPrice).toBe(10000);

    const both = computeRecipeRow(recipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon", "Martlock"] });
    expect(both.sellRefPrice).toBe(15000);
  });

  test("restringir ciudades de compra cambia el costo de materiales", () => {
    const data = market({
      T6_POTION_HEAL: [point("Caerleon", 10000)],
      T6_FOXGLOVE: [point("Caerleon", 200), point("Martlock", 50)],
    });
    const onlyCaerleon = computeRecipeRow(recipe, data, { ...DEFAULT_PARAMS, buyCities: ["Caerleon"], sellCities: ["Caerleon"] });
    const both = computeRecipeRow(recipe, data, { ...DEFAULT_PARAMS, buyCities: ["Caerleon", "Martlock"], sellCities: ["Caerleon"] });
    expect(onlyCaerleon.materials[0].buyRefPrice).toBe(200);
    expect(both.materials[0].buyRefPrice).toBe(50);
    expect(onlyCaerleon.costPerUnit!).toBeGreaterThan(both.costPerUnit!);
  });

  test("foco activado sube el retorno y por lo tanto baja el costo de materiales", () => {
    const data = market({
      T6_POTION_HEAL: [point("Caerleon", 10000)],
      T6_FOXGLOVE: [point("Caerleon", 100)],
    });
    const sinFoco = computeRecipeRow(recipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"], buyCities: ["Caerleon"] });
    const conFoco = computeRecipeRow(recipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      focus: true,
    });
    expect(conFoco.returnRatePct).toBeGreaterThan(sinFoco.returnRatePct);
    expect(conFoco.costPerUnit!).toBeLessThan(sinFoco.costPerUnit!);
  });

  test("cuota de mercado escala plata/dia linealmente", () => {
    const data = market({
      T6_POTION_HEAL: [point("Caerleon", 10000, 100)],
      T6_FOXGLOVE: [point("Caerleon", 100)],
    });
    const full = computeRecipeRow(recipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"], buyCities: ["Caerleon"], marketShare: 1 });
    const half = computeRecipeRow(recipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"], buyCities: ["Caerleon"], marketShare: 0.5 });
    expect(half.platinumPerDay!).toBeCloseTo(full.platinumPerDay! / 2, 5);
  });

  test("sin cotizaciones de venta en las ciudades elegidas, hasData es false y platinumPerDay es null", () => {
    const data = market({
      T6_POTION_HEAL: [point("Martlock", 10000)],
      T6_FOXGLOVE: [point("Caerleon", 100)],
    });
    const row = computeRecipeRow(recipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"], buyCities: ["Caerleon"] });
    expect(row.hasData).toBe(false);
    expect(row.sellRefPrice).toBeNull();
    expect(row.platinumPerDay).toBeNull();
  });
});
