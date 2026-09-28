import { describe, expect, test } from "vitest";
import { famePerResource, journalFamePerCraft } from "@/lib/formulas/journal-fame";
import { ALL_JOURNAL_MARKET_ITEMS, journalBaseName, journalItemName, recipeJournal } from "@/lib/journals";
import { computeRecipeRow, DEFAULT_PARAMS, type CityPricePoint, type MarketData } from "@/lib/recipe-math";
import { computeCraft, type CraftParams } from "@/lib/craft-calc";
import { netSellMultiplier, saleTaxRate } from "@/lib/formulas/market-tax";
import type { Recipe } from "@/lib/db/schema";

const sword: Recipe = {
  itemId: "T6_MAIN_SWORD",
  baseItemId: "T6_MAIN_SWORD",
  nameEs: "Espada ancha",
  nameEn: "Broadsword",
  namePt: null,
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
  materialItemValue: "1536",
};

function point(city: string, price: number | null, quality = 1, volume = 100): CityPricePoint {
  return { city, quality, price, priceAgeSeconds: 3600, buyPriceMax: null, avgDailyVolume30d: volume, daysWithVolume30d: 30, weightedAvgPrice30d: price };
}

describe("fama de diario por craft", () => {
  test("tabla por tier y cada encantamiento la duplica (T4 coincide con los @famevalue del volcado)", () => {
    expect(famePerResource(4, 0)).toBe(22.5);
    expect([1, 2, 3, 4].map((e) => famePerResource(4, e))).toEqual([45, 90, 180, 360]);
    expect(famePerResource(8, 0)).toBe(1395);
  });

  test("solo cuentan los recursos refinados; artefactos y fichas no suman fama", () => {
    const materials = [
      { itemId: "T4_METALBAR_LEVEL1@1", count: 16 },
      { itemId: "T4_ARTEFACT_MAIN_SCIMITAR_MORGANA", count: 1 },
      { itemId: "T4_QUESTITEM_TOKEN_AVALON", count: 1 },
    ];
    expect(journalFamePerCraft(4, 1, materials, 1.1)).toBeCloseTo(16 * 45 * 1.1, 6);
  });
});

describe("recipeJournal", () => {
  test("una espada T6 llena el diario de herrero T6: 24 recursos x 270 = 6.480 de 14.400", () => {
    const j = recipeJournal(sword)!;
    expect(j.type).toBe("WARRIOR");
    expect(j.emptyItemId).toBe("T6_JOURNAL_WARRIOR_EMPTY");
    expect(j.fullItemId).toBe("T6_JOURNAL_WARRIOR_FULL");
    expect(j.famePerCraft).toBe(6480);
    expect(j.maxFame).toBe(14400);
    expect(j.journalsPerUnit).toBeCloseTo(0.45, 10);
  });

  test("refinado, alquimia y cocina no llenan ningún diario", () => {
    const planks: Recipe = { ...sword, itemId: "T6_PLANKS", baseItemId: "T6_PLANKS", stationType: "refining" };
    const potion: Recipe = { ...sword, itemId: "T6_POTION_HEAL", baseItemId: "T6_POTION_HEAL", stationType: "alchemy" };
    expect(recipeJournal(planks)).toBeNull();
    expect(recipeJournal(potion)).toBeNull();
  });

  test("nombra el diario exacto a usar, como en el juego", () => {
    const j = recipeJournal(sword)!;
    expect(journalBaseName(j, "es")).toBe("Diario del herrero maestro");
    expect(journalItemName(j.emptyItemId, "es")).toBe("Diario del herrero maestro (vacío)");
    expect(journalItemName(j.fullItemId, "en")).toBe("Master Blacksmith's Journal (Full)");
    for (const id of ALL_JOURNAL_MARKET_ITEMS) expect(journalItemName(id, "es")).not.toBe(id);
  });

  test("los ids de mercado cubren los 4 diarios de crafteo, vacío y lleno, T2-T8", () => {
    expect(ALL_JOURNAL_MARKET_ITEMS).toHaveLength(4 * 7 * 2);
    expect(ALL_JOURNAL_MARKET_ITEMS).toContain("T8_JOURNAL_TOOLMAKER_FULL");
  });
});

describe("diarios en el ranking", () => {
  const data: MarketData = new Map(
    Object.entries({
      T6_MAIN_SWORD: [point("Caerleon", 10000)],
      T6_METALBAR: [point("Caerleon", 100)],
      T6_LEATHER: [point("Caerleon", 100)],
      T6_JOURNAL_WARRIOR_EMPTY: [point("Caerleon", 8000), point("Martlock", 7000)],
      T6_JOURNAL_WARRIOR_FULL: [point("Caerleon", 30000)],
    }),
  );
  const params = { ...DEFAULT_PARAMS, buyCities: ["Caerleon", "Martlock"] as ("Caerleon" | "Martlock")[], sellCities: ["Caerleon" as const] };

  test("suma la ganancia del diario al costo, al ingreso neto y a la ganancia", () => {
    const off = computeRecipeRow(sword, data, { ...params, journals: false });
    const on = computeRecipeRow(sword, data, params);
    const perUnit = 0.45 * (30000 * netSellMultiplier() - 7000);

    expect(on.journal!.emptyPrice).toBe(7000);
    expect(on.journal!.emptyCity).toBe("Martlock");
    expect(on.journal!.fullPrice).toBe(30000);
    expect(on.journal!.profitPerUnit).toBeCloseTo(perUnit, 6);
    expect(on.journal!.included).toBe(true);
    expect(on.costPerUnit! - off.costPerUnit!).toBeCloseTo(0.45 * 7000, 6);
    expect(on.profitPerUnit! - off.profitPerUnit!).toBeCloseTo(perUnit, 6);
    expect(on.platinumPerDay!).toBeGreaterThan(off.platinumPerDay!);
    // Desactivado sigue mostrando el diario en la derivación, sin sumarlo.
    expect(off.journal!.included).toBe(false);
    expect(off.journal!.profitPerUnit).toBeCloseTo(perUnit, 6);
  });

  test("sin precio del diario lleno no se suma nada", () => {
    const noFull = new Map(data);
    noFull.delete("T6_JOURNAL_WARRIOR_FULL");
    const on = computeRecipeRow(sword, noFull, params);
    const off = computeRecipeRow(sword, noFull, { ...params, journals: false });
    expect(on.journal!.profitPerUnit).toBeNull();
    expect(on.journal!.included).toBe(false);
    expect(on.profitPerUnit).toBe(off.profitPerUnit);
  });
});

describe("diarios en la calculadora", () => {
  const market: Record<string, CityPricePoint[]> = {
    T6_MAIN_SWORD: [point("Caerleon", 10000)],
    T6_METALBAR: [point("Caerleon", 100)],
    T6_LEATHER: [point("Caerleon", 100)],
    T6_JOURNAL_WARRIOR_EMPTY: [point("Caerleon", 7000)],
    T6_JOURNAL_WARRIOR_FULL: [point("Caerleon", 30000)],
  };
  const p: CraftParams = {
    qty: 10,
    premium: true,
    blackMarket: false,
    quality: 1,
    craftCity: "Caerleon",
    focus: false,
    feeRate: 500,
    extraCost: 0,
    sellOverride: null,
    matOverrides: {},
  };

  test("10 espadas llenan 4,5 diarios: se compran vacíos y se venden llenos con el mismo impuesto", () => {
    const on = computeCraft(sword, market, p);
    const off = computeCraft(sword, market, { ...p, journals: false });
    expect(on.journal!.count).toBeCloseTo(4.5, 10);
    expect(on.cost - off.cost).toBeCloseTo(4.5 * 7000, 6);
    expect(on.revenue - off.revenue).toBeCloseTo(4.5 * 30000 * (1 - saleTaxRate(true)), 6);
  });

  test("un plan guardado antes de los diarios (sin el campo) los incluye", () => {
    expect(computeCraft(sword, market, p).journal!.included).toBe(true);
  });
});
