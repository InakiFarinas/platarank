import { describe, expect, test } from "vitest";
import { computeCityAggregates } from "@/lib/ingest/aggregate";
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

describe("computeCityAggregates", () => {
  test("una fila por cada una de las 8 ubicaciones, con o sin dato", () => {
    const rows = computeCityAggregates("T6_POTION_HEAL", [priceRow("Caerleon", 13000)], [], now);
    expect(rows).toHaveLength(8);
    const caerleon = rows.find((r) => r.city === "Caerleon");
    expect(caerleon?.price).toBe(13000);
    expect(caerleon?.priceAgeSeconds).toBe(3600);
    const martlock = rows.find((r) => r.city === "Martlock");
    expect(martlock?.price).toBeNull();
  });

  test("Black Market usa buy_price_max, no sell_price_min", () => {
    const prices: AodpPriceRow[] = [
      {
        item_id: "T6_POTION_HEAL",
        city: "Black Market",
        quality: 1,
        sell_price_min: 999999, // no deberia usarse
        sell_price_min_date: "2026-09-15T11:00:00",
        sell_price_max: 0,
        sell_price_max_date: "2026-09-15T11:00:00",
        buy_price_min: 0,
        buy_price_min_date: "2026-09-15T11:00:00",
        buy_price_max: 29498,
        buy_price_max_date: "2026-09-15T11:00:00",
      },
    ];
    const rows = computeCityAggregates("T6_POTION_HEAL", prices, [], now);
    const bm = rows.find((r) => r.city === "Black Market");
    expect(bm?.price).toBe(29498);
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
    const rows = computeCityAggregates("T6_POTION_HEAL", [], history, now);
    const caerleon = rows.find((r) => r.city === "Caerleon");
    expect(caerleon?.avgDailyVolume30d).toBeCloseTo(10, 5); // 300 / 30
    expect(caerleon?.daysWithVolume30d).toBe(1);
    expect(caerleon?.weightedAvgPrice30d).toBe(13000);
  });
});
