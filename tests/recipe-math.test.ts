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

describe("computeRecipeRow (refinado)", () => {
  const planksRecipe: Recipe = {
    itemId: "T4_PLANKS",
    baseItemId: "T4_PLANKS",
    nameEs: "Tablas",
    nameEn: "Planks",
    tier: 4,
    enchant: 0,
    stationType: "refining",
    batchSize: 1,
    craftingFocus: 54,
    materials: [
      { itemId: "T4_WOOD", count: 2, category: "other", nameEs: "Troncos", nameEn: "Logs" },
      { itemId: "T3_PLANKS", count: 1, category: "other", nameEs: "Tablas T3", nameEn: "Planks T3" },
    ],
  };

  test("el fee de refinado no depende de los materiales, solo de tier y encantamiento", () => {
    const data = market({
      T4_PLANKS: [point("Caerleon", 100)],
      T4_WOOD: [point("Caerleon", 10)],
      T3_PLANKS: [point("Caerleon", 20)],
    });
    const row = computeRecipeRow(planksRecipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"], buyCities: ["Caerleon"] });
    // (235/1000) * 18 * 2^(4-4) * 2^0 = 0.235 * 18
    expect(row.feePerBatch).toBeCloseTo(0.235 * 18, 5);
  });

  test("sin especialidad de refinado, el retorno es igual al de alquimia sin especialidad de crafteo", () => {
    const data = market({
      T4_PLANKS: [point("Caerleon", 100)],
      T4_WOOD: [point("Caerleon", 10)],
      T3_PLANKS: [point("Caerleon", 20)],
    });
    const row = computeRecipeRow(planksRecipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      refiningSpecialty: false,
    });
    expect(row.specialtyActive).toBe(false);
    expect(row.returnRatePct).toBeCloseTo(0.152, 2); // solo el bonus base de estacion (18%)
  });

  test("con especialidad de refinado activada, el retorno sube al escalon de +40%", () => {
    const data = market({
      T4_PLANKS: [point("Caerleon", 100)],
      T4_WOOD: [point("Caerleon", 10)],
      T3_PLANKS: [point("Caerleon", 20)],
    });
    const row = computeRecipeRow(planksRecipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      refiningSpecialty: true,
    });
    expect(row.specialtyActive).toBe(true);
    expect(row.returnRatePct).toBeCloseTo(0.367, 2); // 18% + 40% de especialidad de refinado
  });
});
