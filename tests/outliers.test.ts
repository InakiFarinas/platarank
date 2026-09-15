import { describe, expect, test } from "vitest";
import { robustStat, trimOutliers } from "@/lib/formulas/outliers";

describe("trimOutliers", () => {
  test("con menos de 3 cotizaciones no filtra nada", () => {
    const quotes = [
      { city: "Caerleon", price: 100 },
      { city: "Martlock", price: 100_000_000 },
    ];
    const result = trimOutliers(quotes, "min");
    expect(result.kept).toHaveLength(2);
    expect(result.discarded).toHaveLength(0);
  });

  test("target=min recorta solo la cola baja (bait cerca de cero)", () => {
    const quotes = [
      { city: "Caerleon", price: 13000 },
      { city: "Martlock", price: 12500 },
      { city: "Lymhurst", price: 1 }, // bait
    ];
    const result = trimOutliers(quotes, "min");
    expect(result.discarded).toEqual([{ city: "Lymhurst", price: 1, reason: "outlier_low" }]);
    expect(result.kept.map((q) => q.city)).toEqual(["Caerleon", "Martlock"]);
  });

  test("target=max recorta solo la cola alta (listing troll)", () => {
    const quotes = [
      { city: "Caerleon", price: 13000 },
      { city: "Martlock", price: 12500 },
      { city: "Lymhurst", price: 100_999_666 }, // troll
    ];
    const result = trimOutliers(quotes, "max");
    expect(result.discarded).toEqual([{ city: "Lymhurst", price: 100_999_666, reason: "outlier_high" }]);
  });

  test("target=median recorta ambas colas", () => {
    const quotes = [
      { city: "Caerleon", price: 13000 },
      { city: "Martlock", price: 12500 },
      { city: "Lymhurst", price: 1 },
      { city: "Bridgewatch", price: 100_999_666 },
    ];
    const result = trimOutliers(quotes, "median");
    expect(result.kept.map((q) => q.city).sort()).toEqual(["Caerleon", "Martlock"]);
    expect(result.discarded).toHaveLength(2);
  });

  test("referencia de venta nunca es el maximo: robustStat(median) no puede devolver el pico", () => {
    const quotes = [
      { city: "Caerleon", price: 13000 },
      { city: "Martlock", price: 12500 },
      { city: "Lymhurst", price: 14000 },
      { city: "Bridgewatch", price: 40000 }, // un puesto raro, no representativo
    ];
    const { value } = robustStat(quotes, "median");
    expect(value).not.toBe(40000);
  });
});

describe("robustStat", () => {
  test("value es null cuando todas las cotizaciones son descartadas", () => {
    const quotes = [
      { city: "Caerleon", price: 100 },
      { city: "Martlock", price: 100 },
      { city: "Lymhurst", price: 100_000_000 },
    ];
    const { value } = robustStat(quotes, "max");
    // la mediana es 100, el umbral alto es 250; solo Lymhurst supera y se descarta,
    // los otros dos sobreviven -> value no deberia ser null aca.
    expect(value).toBe(100);
  });
});
