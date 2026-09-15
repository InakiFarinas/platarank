import { describe, expect, test } from "vitest";
import { alchemyStationFeePerBatch, refiningStationFeePerBatch } from "@/lib/formulas/station-fee";

describe("alchemyStationFeePerBatch", () => {
  // T6_POTION_HEAL@1, lote de 5: 72 T6_FOXGLOVE + 18 T5_EGG + 18 T6_ALCOHOL (todos "farm"),
  // + 45 T1_ALCHEMY_EXTRACT_LEVEL1 (extract, no paga fee). Tarifa de ejemplo: 235/100 nutricion.
  const heal6Ench1Materials = [
    { category: "farm" as const, count: 72 },
    { category: "farm" as const, count: 18 },
    { category: "farm" as const, count: 18 },
    { category: "extract" as const, count: 45 },
  ];

  test("solo cuenta materiales de granja, ignora extractos", () => {
    const fee = alchemyStationFeePerBatch(heal6Ench1Materials, 235);
    // (235/1000) * 45 * (72+18+18) = 0.235 * 45 * 108
    expect(fee).toBeCloseTo(0.235 * 45 * 108, 5);
  });

  test("no depende del tier ni del encantamiento, solo de los materiales pasados", () => {
    const feeLowTier = alchemyStationFeePerBatch([{ category: "farm", count: 10 }], 235);
    const feeHighTierSameFarmCount = alchemyStationFeePerBatch(
      [
        { category: "farm", count: 10 },
        { category: "artifact", count: 999 },
      ],
      235,
    );
    expect(feeLowTier).toBeCloseTo(feeHighTierSameFarmCount, 5);
  });

  test("artefactos no pagan fee", () => {
    const fee = alchemyStationFeePerBatch([{ category: "artifact", count: 500 }], 235);
    expect(fee).toBe(0);
  });

  test("escala linealmente con la tarifa", () => {
    const materials = [{ category: "farm" as const, count: 20 }];
    const feeAt100 = alchemyStationFeePerBatch(materials, 100);
    const feeAt200 = alchemyStationFeePerBatch(materials, 200);
    expect(feeAt200).toBeCloseTo(feeAt100 * 2, 5);
  });
});

describe("refiningStationFeePerBatch", () => {
  test("T4 sin encantar es la base: (tarifa/1000) * 18", () => {
    const fee = refiningStationFeePerBatch(4, 0, 235);
    expect(fee).toBeCloseTo(0.235 * 18, 5);
  });

  test("cada tier por encima de T4 duplica el fee", () => {
    const t4 = refiningStationFeePerBatch(4, 0, 235);
    const t5 = refiningStationFeePerBatch(5, 0, 235);
    const t6 = refiningStationFeePerBatch(6, 0, 235);
    expect(t5).toBeCloseTo(t4 * 2, 5);
    expect(t6).toBeCloseTo(t4 * 4, 5);
  });

  test("cada tier por debajo de T4 divide el fee a la mitad", () => {
    const t4 = refiningStationFeePerBatch(4, 0, 235);
    const t2 = refiningStationFeePerBatch(2, 0, 235);
    expect(t2).toBeCloseTo(t4 / 4, 5);
  });

  test("cada nivel de encantamiento duplica el fee", () => {
    const ench0 = refiningStationFeePerBatch(6, 0, 235);
    const ench1 = refiningStationFeePerBatch(6, 1, 235);
    expect(ench1).toBeCloseTo(ench0 * 2, 5);
  });

  test("no depende de los materiales, solo de tier/encantamiento/tarifa", () => {
    // a diferencia de alquimia, refinado no recibe la lista de materiales
    const fee = refiningStationFeePerBatch(8, 4, 235);
    expect(fee).toBeGreaterThan(0);
  });
});
