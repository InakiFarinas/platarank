import { describe, expect, test } from "vitest";
import { computeQualityScore } from "@/lib/formulas/quality-score";

const perfect = {
  oldestQuoteAgeHours: 0,
  citiesQuoted: 8,
  daysWithVolume: 30,
  windowDays: 30,
  deviationFromHistorical: 0,
};

describe("computeQualityScore", () => {
  test("condiciones perfectas dan 100", () => {
    expect(computeQualityScore(perfect)).toBe(100);
  });

  test("mas edad del dato mas viejo baja el score", () => {
    const fresh = computeQualityScore(perfect);
    const stale = computeQualityScore({ ...perfect, oldestQuoteAgeHours: 48 });
    expect(stale).toBeLessThan(fresh);
  });

  test("menos ciudades cotizando baja el score", () => {
    const full = computeQualityScore(perfect);
    const brecilienDesierto = computeQualityScore({ ...perfect, citiesQuoted: 1 });
    expect(brecilienDesierto).toBeLessThan(full);
  });

  test("nunca baja de 0 ni sube de 100 con inputs extremos", () => {
    const worst = computeQualityScore({
      oldestQuoteAgeHours: 10_000,
      citiesQuoted: 0,
      daysWithVolume: 0,
      windowDays: 30,
      deviationFromHistorical: 10,
    });
    expect(worst).toBeGreaterThanOrEqual(0);
    expect(worst).toBeLessThanOrEqual(100);
  });
});
