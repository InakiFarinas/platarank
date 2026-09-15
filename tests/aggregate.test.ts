import { describe, expect, test } from "vitest";
import { computeItemAggregate } from "@/lib/ingest/aggregate";
import type { AodpHistoryRow, AodpPriceRow } from "@/lib/aodp/types";

const now = new Date("2026-09-15T12:00:00Z");

function priceRow(city: string, sellMin: number, hoursAgo = 1): AodpPriceRow {
  const date = new Date(now.getTime() - hoursAgo * 3600 * 1000).toISOString().replace("Z", "");
  return {
    item_id: "T6_POTION_HEAL",
    city,
    quality: 1,
    sell_price_min: sellMin,
    sell_price_min_date: date,
    sell_price_max: sellMin,
    sell_price_max_date: date,
    buy_price_min: 0,
    buy_price_min_date: date,
    buy_price_max: 0,
    buy_price_max_date: date,
  };
}

describe("computeItemAggregate", () => {
  test("descarta el bait y usa la mediana de las ciudades reales para sellRefPrice", () => {
    const prices = [
      priceRow("Caerleon", 13000),
      priceRow("Martlock", 12500),
      priceRow("Lymhurst", 100_999_666), // troll
    ];
    const agg = computeItemAggregate("T6_POTION_HEAL", prices, [], now);
    expect(agg.sellRefPrice).toBe(12750); // mediana de Caerleon (13000) y Martlock (12500)
    expect(agg.discarded).toContainEqual({
      city: "Lymhurst",
      field: "sell_price_min",
      price: 100_999_666,
      reason: "outlier_high",
    });
    expect(agg.brecilienCovered).toBe(false);
  });

  test("sin ninguna cotizacion, sellRefPrice es null y no rompe", () => {
    const agg = computeItemAggregate("T6_POTION_HEAL", [], [], now);
    expect(agg.sellRefPrice).toBeNull();
    expect(agg.qualityScore).toBeLessThan(50);
  });

  test("black market se descarta si se desvia demasiado del historico ponderado", () => {
    const prices: AodpPriceRow[] = [
      {
        item_id: "T6_POTION_HEAL",
        city: "Black Market",
        quality: 1,
        sell_price_min: 0,
        sell_price_min_date: "2026-09-15T11:00:00",
        sell_price_max: 0,
        sell_price_max_date: "2026-09-15T11:00:00",
        buy_price_min: 0,
        buy_price_min_date: "2026-09-15T11:00:00",
        buy_price_max: 299_999,
        buy_price_max_date: "2026-09-15T11:00:00",
      },
    ];
    const history: AodpHistoryRow[] = [
      {
        location: "Black Market",
        item_id: "T6_POTION_HEAL",
        quality: 1,
        data: [{ item_count: 10, avg_price: 29498, timestamp: "2026-09-14T00:00:00" }],
      },
    ];
    const agg = computeItemAggregate("T6_POTION_HEAL", prices, history, now);
    expect(agg.bmSellPrice).toBeNull();
    expect(agg.bmDiscardReason).toBe("outlier_high");
  });

  test("volumen diario promedia sobre la ventana de 30 dias, no solo sobre los dias con datos", () => {
    const history: AodpHistoryRow[] = [
      {
        location: "Caerleon",
        item_id: "T6_POTION_HEAL",
        quality: 1,
        data: [{ item_count: 300, avg_price: 13000, timestamp: "2026-09-14T00:00:00" }],
      },
    ];
    const agg = computeItemAggregate("T6_POTION_HEAL", [], history, now);
    expect(agg.avgDailyVolume30d).toBeCloseTo(10, 5); // 300 / 30
    expect(agg.daysWithVolume30d).toBe(1);
  });
});
