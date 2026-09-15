import { describe, expect, test } from "vitest";
import { returnRate, returnRateBonus } from "@/lib/formulas/return-rate";

describe("returnRate", () => {
  test("estacion base sola: 18% de bonus -> 15.2% de retorno", () => {
    const rate = returnRate({ cityCraftingSpecialty: false, cityRefiningSpecialty: false, focus: false });
    expect(rate).toBeCloseTo(0.152, 2);
  });

  test("+ especialidad de crafteo: 33% de bonus -> 24.8% de retorno", () => {
    const rate = returnRate({ cityCraftingSpecialty: true, cityRefiningSpecialty: false, focus: false });
    expect(rate).toBeCloseTo(0.248, 3);
  });

  test("+ especialidad de refinado en vez de crafteo: 58% de bonus -> 36.7% de retorno", () => {
    const rate = returnRate({ cityCraftingSpecialty: false, cityRefiningSpecialty: true, focus: false });
    expect(rate).toBeCloseTo(0.367, 3);
  });

  test("los bonus se suman antes de aplicar la formula, no se componen", () => {
    const bonus = returnRateBonus({ cityCraftingSpecialty: true, cityRefiningSpecialty: true, focus: true });
    expect(bonus).toBeCloseTo(0.18 + 0.15 + 0.4 + 0.59, 5);
  });

  test("mas bonus siempre da mas retorno (monotonico)", () => {
    const base = returnRate({ cityCraftingSpecialty: false, cityRefiningSpecialty: false, focus: false });
    const withFocus = returnRate({ cityCraftingSpecialty: false, cityRefiningSpecialty: false, focus: true });
    expect(withFocus).toBeGreaterThan(base);
  });
});
