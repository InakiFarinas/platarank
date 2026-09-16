import { describe, expect, test } from "vitest";
import { computeCityAggregates } from "@/lib/ingest/aggregate";
import type { DumpVolumeSummary } from "@/lib/aodp/dumps";
import type { AodpPriceRow } from "@/lib/aodp/types";

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
    const rows = computeCityAggregates("T6_POTION_HEAL", [priceRow("Caerleon", 13000)], new Map(), now);
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
    const rows = computeCityAggregates("T6_POTION_HEAL", prices, new Map(), now);
    const bm = rows.find((r) => r.city === "Black Market");
    expect(bm?.price).toBe(29498);
  });

  test("el volumen sale del resumen del dump, keyeado por itemId|quality|city", () => {
    const volumeSummaries = new Map<string, DumpVolumeSummary>([
      ["T6_POTION_HEAL|1|Caerleon", { avgDailyVolume30d: 10, daysWithVolume30d: 1, weightedAvgPrice30d: 13000 }],
    ]);
    const rows = computeCityAggregates("T6_POTION_HEAL", [], volumeSummaries, now);
    const caerleon = rows.find((r) => r.city === "Caerleon");
    expect(caerleon?.avgDailyVolume30d).toBe(10);
    expect(caerleon?.daysWithVolume30d).toBe(1);
    expect(caerleon?.weightedAvgPrice30d).toBe(13000);

    const martlock = rows.find((r) => r.city === "Martlock");
    expect(martlock?.avgDailyVolume30d).toBe(0);
    expect(martlock?.daysWithVolume30d).toBe(0);
    expect(martlock?.weightedAvgPrice30d).toBeNull();
  });
});
