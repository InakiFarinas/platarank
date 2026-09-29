import { describe, expect, test } from "vitest";
import { siteBonus, siteReturnRate } from "@/lib/formulas/craft-site";

// Royal city return rates (hideouts are covered in craft-site.test.ts).
const inCity = (category: string, stationType: string, city: string) => siteBonus(undefined, { stationType, craftingCategory: category }, city).bonus;

describe("retorno en ciudades", () => {
  test("estacion base sola: 18% de bonus -> 15.2% de retorno", () => {
    expect(siteReturnRate(inCity("sword", "gear", "Martlock"), false)).toBeCloseTo(0.152, 2);
  });

  test("+ especialidad de crafteo: 33% de bonus -> 24.8% de retorno", () => {
    expect(siteReturnRate(inCity("sword", "gear", "Lymhurst"), false)).toBeCloseTo(0.248, 3);
  });

  test("+ especialidad de refinado: 58% de bonus -> 36.7% de retorno", () => {
    expect(siteReturnRate(inCity("ore", "refining", "Thetford"), false)).toBeCloseTo(0.367, 3);
  });

  test("el foco suma +59% al bonus antes de la formula, no se compone", () => {
    const bonus = inCity("sword", "gear", "Lymhurst");
    expect(siteReturnRate(bonus, true)).toBeCloseTo(1 - 1 / (1 + 0.18 + 0.15 + 0.59), 10);
    expect(siteReturnRate(bonus, true)).toBeGreaterThan(siteReturnRate(bonus, false));
  });
});
