import { describe, expect, test } from "vitest";
import { computeFlipRow, DEFAULT_FLIP_PARAMS, type FlipParams } from "@/lib/flip-math";
import type { CityPricePoint, MarketData } from "@/lib/recipe-math";
import type { FlipItem } from "@/lib/flip-items";

const item: FlipItem = { itemId: "T6_ORE", tier: 6, nameEs: "Mineral de hierro", nameEn: "Iron Ore", namePt: "Minério de Ferro" };

function point(city: string, price: number | null, buyPriceMax: number | null = null, volume = 1000, days = 30): CityPricePoint {
  return { city, quality: 1, price, priceAgeSeconds: 3600, buyPriceMax, avgDailyVolume30d: volume, daysWithVolume30d: days, weightedAvgPrice30d: price };
}

function market(points: CityPricePoint[]): MarketData {
  return new Map([[item.itemId, points]]);
}

const params: FlipParams = { ...DEFAULT_FLIP_PARAMS };

describe("computeFlipRow", () => {
  test("compra en la ciudad más barata, vende en la que paga más neto", () => {
    const data = market([point("Caerleon", 100), point("Martlock", 150, 140)]);
    const row = computeFlipRow(item, data, params);
    expect(row.hasData).toBe(true);
    expect(row.buyCity).toBe("Caerleon");
    expect(row.buyPrice).toBe(100);
    expect(row.buyMethod).toBe("instant");
    expect(row.sellCity).toBe("Martlock");
    expect(row.sellMethod).toBe("listing");
    expect(row.marginPerUnit).not.toBeNull();
    expect(row.marginPerUnit!).toBeGreaterThan(0);
  });

  test("una orden de compra instantánea gana si su neto (sin tarifa de publicación) supera al listing", () => {
    // listing neto = 150 * 0.935 = 140.25; buyPriceMax neto = 149 * 0.96 = 143.04 -- gana instant.
    const data = market([point("Caerleon", 100), point("Martlock", 150, 149)]);
    const row = computeFlipRow(item, data, params);
    expect(row.sellMethod).toBe("instant");
    expect(row.sellPriceGross).toBe(149);
  });

  test("comprar y vender en la misma ciudad da margen negativo, no rompe", () => {
    const data = market([point("Caerleon", 100)]);
    const row = computeFlipRow(item, data, params);
    expect(row.buyCity).toBe("Caerleon");
    expect(row.sellCity).toBe("Caerleon");
    expect(row.marginPerUnit!).toBeLessThan(0);
  });

  test("sin liquidez en ninguna ciudad: hasData false, no plata/día fantasma", () => {
    const data = market([point("Caerleon", 100, null, 0, 0), point("Martlock", 150, null, 0, 0)]);
    const row = computeFlipRow(item, data, params);
    expect(row.hasData).toBe(false);
    expect(row.platinumPerDay).toBeNull();
  });

  test("el volumen del flip es el mínimo entre la ciudad de compra y la de venta, no el de venta solo", () => {
    const data = market([point("Caerleon", 100, null, 50), point("Martlock", 150, 140, 9000)]);
    const row = computeFlipRow(item, data, params);
    expect(row.avgDailyVolume30d).toBe(50);
  });

  test("en modo automático, poner tu propia orden de compra gana si es más barata que comprar ya", () => {
    const data = market([point("Caerleon", 100, 90), point("Martlock", 150, 140)]);
    const row = computeFlipRow(item, data, params);
    expect(row.buyCity).toBe("Caerleon");
    expect(row.buyPrice).toBe(90);
    expect(row.buyMethod).toBe("order");
  });

  test("buyMethodPref 'instant' ignora la orden de compra propia aunque sea más barata", () => {
    const data = market([point("Caerleon", 100, 90)]);
    const row = computeFlipRow(item, data, { ...params, buyMethodPref: "instant" });
    expect(row.buyPrice).toBe(100);
    expect(row.buyMethod).toBe("instant");
  });

  test("buyMethodPref 'order' ignora comprar ya, incluso si no hay orden de compra en esa ciudad", () => {
    const withOrder = market([point("Caerleon", 100, 90)]);
    const rowWithOrder = computeFlipRow(item, withOrder, { ...params, buyMethodPref: "order" });
    expect(rowWithOrder.buyPrice).toBe(90);
    expect(rowWithOrder.buyMethod).toBe("order");

    const withoutOrder = market([point("Caerleon", 100)]);
    const rowWithoutOrder = computeFlipRow(item, withoutOrder, { ...params, buyMethodPref: "order" });
    expect(rowWithoutOrder.hasData).toBe(false);
    expect(rowWithoutOrder.buyPrice).toBeNull();
  });

  test("los supuestos por defecto nunca ofrecen Black Market como ciudad de compra", () => {
    // Black Market solo tiene órdenes de compra, no listings de venta -- no hay de dónde "comprar
    // barato" ahí. La UI nunca lo ofrece como ciudad de compra; esto fija esa garantía a nivel de
    // los supuestos por defecto, no solo de la pantalla.
    expect(DEFAULT_FLIP_PARAMS.buyCities).not.toContain("Black Market");
    expect(DEFAULT_FLIP_PARAMS.sellCities).toContain("Black Market");
  });
});
