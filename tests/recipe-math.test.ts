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
  craftingCategory: "potion",
  maxQualityLevel: 1,
  batchSize: 5,
  craftingFocus: 0,
  materials: [{ itemId: "T6_FOXGLOVE", count: 72, category: "farm", nameEs: "Dedalera", nameEn: "Foxglove" }],
  materialItemValue: "2880",
};

function point(city: string, price: number | null, volume = 1000, quality = 1, days = 30): CityPricePoint {
  return { city, quality, price, priceAgeSeconds: 3600, avgDailyVolume30d: volume, daysWithVolume30d: days, weightedAvgPrice30d: price };
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

  test("alquimia siempre asume la especialidad de Brecilien, sin importar craftCity", () => {
    const data = market({
      T6_POTION_HEAL: [point("Caerleon", 10000)],
      T6_FOXGLOVE: [point("Caerleon", 100)],
    });
    const row = computeRecipeRow(recipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"], buyCities: ["Caerleon"], craftCity: "Brecilien" });
    expect(row.specialtyActive).toBe(true);
    expect(row.specialtyCity).toBe("Brecilien");
    expect(row.returnRatePct).toBeCloseTo(0.248, 2); // 18% base + 15% especialidad de crafteo

    const elsewhere = computeRecipeRow(recipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      craftCity: "Caerleon",
    });
    expect(elsewhere.specialtyActive).toBe(false);
    expect(elsewhere.returnRatePct).toBeCloseTo(0.152, 2);
  });
});

describe("computeRecipeRow (refinado)", () => {
  // "wood" es la categoria real de refinado de Fort Sterling (craftingmodifiers.xml).
  const planksRecipe: Recipe = {
    itemId: "T4_PLANKS",
    baseItemId: "T4_PLANKS",
    nameEs: "Tablas",
    nameEn: "Planks",
    tier: 4,
    enchant: 0,
    stationType: "refining",
    craftingCategory: "wood",
    maxQualityLevel: 1,
    batchSize: 1,
    craftingFocus: 54,
    materials: [
      { itemId: "T4_WOOD", count: 2, category: "other", nameEs: "Troncos", nameEn: "Logs" },
      { itemId: "T3_PLANKS", count: 1, category: "other", nameEs: "Tablas T3", nameEn: "Planks T3" },
    ],
    materialItemValue: "1000",
  };

  test("el fee usa la formula universal Item Value x Tax x 0.001125, redondeada", () => {
    const data = market({
      T4_PLANKS: [point("Caerleon", 100)],
      T4_WOOD: [point("Caerleon", 10)],
      T3_PLANKS: [point("Caerleon", 20)],
    });
    const row = computeRecipeRow(planksRecipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"], buyCities: ["Caerleon"] });
    // 1000 * 235 * 0.001125 = 264.375 -> redondeado a 264
    expect(row.feePerBatch).toBe(264);
  });

  test("craftCity fuera de Fort Sterling: sin especialidad de refinado", () => {
    const data = market({
      T4_PLANKS: [point("Caerleon", 100)],
      T4_WOOD: [point("Caerleon", 10)],
      T3_PLANKS: [point("Caerleon", 20)],
    });
    const row = computeRecipeRow(planksRecipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      craftCity: "Caerleon",
    });
    expect(row.specialtyActive).toBe(false);
    expect(row.returnRatePct).toBeCloseTo(0.152, 2); // solo el bonus base de estacion (18%)
  });

  test("craftCity en Fort Sterling: especialidad de refinado activa, retorno +40%", () => {
    const data = market({
      T4_PLANKS: [point("Caerleon", 100)],
      T4_WOOD: [point("Caerleon", 10)],
      T3_PLANKS: [point("Caerleon", 20)],
    });
    const row = computeRecipeRow(planksRecipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      craftCity: "Fort Sterling",
    });
    expect(row.specialtyActive).toBe(true);
    expect(row.specialtyCity).toBe("Fort Sterling");
    expect(row.returnRatePct).toBeCloseTo(0.367, 2); // 18% + 40% de especialidad de refinado
  });
});

describe("computeRecipeRow (cocina)", () => {
  // "food" es la categoria real de crafteo de Caerleon (craftingmodifiers.xml).
  const soupRecipe: Recipe = {
    itemId: "T5_MEAL_SOUP",
    baseItemId: "T5_MEAL_SOUP",
    nameEs: "Sopa de col",
    nameEn: "Cabbage Soup",
    tier: 5,
    enchant: 0,
    stationType: "cooking",
    craftingCategory: "food",
    maxQualityLevel: 1,
    batchSize: 10,
    craftingFocus: 504,
    materials: [{ itemId: "T5_CABBAGE", count: 144, category: "farm", nameEs: "Coles", nameEn: "Cabbage" }],
    materialItemValue: "3000",
  };

  test("el fee de cocina usa la misma formula universal que el resto de los rubros", () => {
    const data = market({
      T5_MEAL_SOUP: [point("Caerleon", 1000)],
      T5_CABBAGE: [point("Caerleon", 10)],
    });
    const row = computeRecipeRow(soupRecipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"], buyCities: ["Caerleon"] });
    // 3000 * 235 * 0.001125 = 793.125 -> redondeado a 793
    expect(row.feePerBatch).toBe(793);
  });

  test("Caerleon como craftCity activa la especialidad de cocina (+15%, no +40%)", () => {
    const data = market({
      T5_MEAL_SOUP: [point("Caerleon", 1000)],
      T5_CABBAGE: [point("Caerleon", 10)],
    });
    const sinEspecialidad = computeRecipeRow(soupRecipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      craftCity: "Brecilien",
    });
    const conEspecialidad = computeRecipeRow(soupRecipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      craftCity: "Caerleon",
    });
    expect(sinEspecialidad.returnRatePct).toBeCloseTo(0.152, 2);
    expect(conEspecialidad.returnRatePct).toBeCloseTo(0.248, 2); // 18% + 15% (crafting specialty), no +40%
  });
});

describe("computeRecipeRow (armas y armaduras)", () => {
  const swordRecipe: Recipe = {
    itemId: "T6_MAIN_SWORD",
    baseItemId: "T6_MAIN_SWORD",
    nameEs: "Espada ancha",
    nameEn: "Broadsword",
    tier: 6,
    enchant: 0,
    stationType: "gear",
    craftingCategory: "sword",
    maxQualityLevel: 5,
    batchSize: 1,
    craftingFocus: 3939,
    materials: [
      { itemId: "T6_METALBAR", count: 16, category: "other", nameEs: "Lingote", nameEn: "Metal Bar" },
      { itemId: "T6_LEATHER", count: 8, category: "other", nameEs: "Cuero", nameEn: "Leather" },
    ],
    materialItemValue: "2000",
  };

  test("el precio de venta pondera por calidad usando qualityWeights", () => {
    const data = market({
      T6_MAIN_SWORD: [
        point("Caerleon", 1000, 100, 1),
        point("Caerleon", 1000, 100, 2), // Q1/Q2 cotizan casi igual, tal como describe el brief
      ],
      T6_METALBAR: [point("Caerleon", 10)],
      T6_LEATHER: [point("Caerleon", 10)],
    });
    const row = computeRecipeRow(swordRecipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      qualityWeights: [0.7, 0.3, 0, 0, 0],
    });
    // 0.7*1000 + 0.3*1000 = 1000 (ambas calidades al mismo precio)
    expect(row.sellRefPrice).toBeCloseTo(1000, 5);
    expect(row.qualityBreakdown).not.toBeNull();
    expect(row.qualityBreakdown!.find((q) => q.quality === 1)!.liquid).toBe(true);
  });

  test("una calidad con volumen cero (listing fantasma) se excluye del calculo, no cuenta como precio real", () => {
    const data = market({
      T6_MAIN_SWORD: [
        point("Caerleon", 1000, 100, 1), // liquido
        point("Caerleon", 139867, 0, 5), // Q5 parado, cero trades -- exactamente el caso del brief
      ],
      T6_METALBAR: [point("Caerleon", 10)],
      T6_LEATHER: [point("Caerleon", 10)],
    });
    const row = computeRecipeRow(swordRecipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      qualityWeights: [0.9, 0, 0, 0, 0.1],
    });
    const q5 = row.qualityBreakdown!.find((q) => q.quality === 5)!;
    expect(q5.liquid).toBe(false);
    expect(q5.price).toBe(139867); // el precio se ve en el detalle, pero no entra al calculo
    // 0.9*1000 + 0.1*(excluido) = 900, NO 0.9*1000 + 0.1*139867
    expect(row.sellRefPrice).toBeCloseTo(900, 5);
  });

  test("una calidad con una sola venta en 30 dias (volumen > 0 pero pocos dias) tampoco cuenta como liquida", () => {
    const data = market({
      T6_MAIN_SWORD: [
        point("Caerleon", 1000, 100, 1), // liquido
        point("Caerleon", 50000, 5, 5, 1), // Q5: una sola venta en un dia -- volume > 0 pero no es liquidez real
      ],
    });
    const row = computeRecipeRow(swordRecipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      qualityWeights: [0.9, 0, 0, 0, 0.1],
    });
    const q5 = row.qualityBreakdown!.find((q) => q.quality === 5)!;
    expect(q5.liquid).toBe(false);
    expect(row.sellRefPrice).toBeCloseTo(900, 5);
  });

  test("sin ninguna calidad liquida, hasData es false", () => {
    const data = market({
      T6_MAIN_SWORD: [point("Caerleon", 1000, 0, 1)],
      T6_METALBAR: [point("Caerleon", 10)],
      T6_LEATHER: [point("Caerleon", 10)],
    });
    const row = computeRecipeRow(swordRecipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"], buyCities: ["Caerleon"] });
    expect(row.hasData).toBe(false);
    expect(row.sellRefPrice).toBeNull();
  });

  test("el fee de equipo usa la misma formula universal (Item Value x Tax x 0.001125)", () => {
    const data = market({
      T6_MAIN_SWORD: [point("Caerleon", 1000, 100, 1)],
      T6_METALBAR: [point("Caerleon", 10)],
      T6_LEATHER: [point("Caerleon", 10)],
    });
    const row = computeRecipeRow(swordRecipe, data, { ...DEFAULT_PARAMS, sellCities: ["Caerleon"], buyCities: ["Caerleon"] });
    // 2000 * 235 * 0.001125 = 528.75 -> redondeado a 529
    expect(row.feePerBatch).toBe(529);
  });

  test("un material de artefacto nunca tiene RRR, aunque los materiales refinados de la misma receta si", () => {
    const artifactRecipe: Recipe = {
      ...swordRecipe,
      materials: [...swordRecipe.materials, { itemId: "T6_ARTEFACT_2H_SWORD_AVALON", count: 4, category: "artifact", nameEs: "Artefacto", nameEn: "Artifact" }],
    };
    const data = market({
      T6_MAIN_SWORD: [point("Caerleon", 1000, 100, 1)],
      T6_METALBAR: [point("Caerleon", 10)],
      T6_LEATHER: [point("Caerleon", 10)],
      T6_ARTEFACT_2H_SWORD_AVALON: [point("Caerleon", 10)],
    });
    const row = computeRecipeRow(artifactRecipe, data, {
      ...DEFAULT_PARAMS,
      sellCities: ["Caerleon"],
      buyCities: ["Caerleon"],
      focus: true,
    });
    const artifactLine = row.materials.find((m) => m.itemId === "T6_ARTEFACT_2H_SWORD_AVALON")!;
    const refinedLine = row.materials.find((m) => m.itemId === "T6_METALBAR")!;
    expect(artifactLine.effectiveCount).toBe(4); // full count, 0% RRR
    expect(refinedLine.effectiveCount).toBeLessThan(refinedLine.count); // RRR applies normally
  });
});
