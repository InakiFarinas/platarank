import { describe, expect, test } from "vitest";
import { craftingFeePerBatch } from "@/lib/formulas/station-fee";

describe("craftingFeePerBatch (formula universal, los cuatro rubros)", () => {
  test("IV x Tax x 0.001125, tal como lo muestra la estacion", () => {
    // IV=1000, tax=350: 1000 * 350 * 0.001125 = 393.75 -> redondeado a 394
    expect(craftingFeePerBatch(1000, 350)).toBe(394);
  });

  test("escala linealmente con el Item Value", () => {
    // Multiplos que caen justo en un entero, para no chocar con el redondeo del propio cliente.
    const fee1000 = craftingFeePerBatch(1000, 200); // 225
    const fee2000 = craftingFeePerBatch(2000, 200); // 450
    expect(fee2000).toBe(fee1000 * 2);
  });

  test("escala linealmente con la tarifa de la estacion", () => {
    const feeAt100 = craftingFeePerBatch(1000, 100); // 112.5 -> 113
    const feeAt200 = craftingFeePerBatch(1000, 200); // 225
    expect(feeAt200).toBe(225);
    expect(feeAt100).toBeGreaterThan(feeAt200 / 2 - 1);
  });

  test("Item Value cero (receta solo de artefactos/extractos) no paga fee", () => {
    expect(craftingFeePerBatch(0, 235)).toBe(0);
  });

  test("redondea al entero mas cercano, como el cliente del juego", () => {
    // 999 * 235 * 0.001125 = 263.98... -> 264
    expect(craftingFeePerBatch(999, 235)).toBe(264);
  });
});
