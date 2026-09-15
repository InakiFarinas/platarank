import { describe, expect, test } from "vitest";
import { craftingStationFeePerBatch, farmStationFeePerBatch, refiningStationFeePerBatch } from "@/lib/formulas/station-fee";

describe("farmStationFeePerBatch (alquimia y cocina)", () => {
  // T6_POTION_HEAL@1, lote de 5: 72 T6_FOXGLOVE + 18 T5_EGG + 18 T6_ALCOHOL (todos "farm"),
  // + 45 T1_ALCHEMY_EXTRACT_LEVEL1 (extract, no paga fee). Tarifa de ejemplo: 235/100 nutricion.
  const heal6Ench1Materials = [
    { itemId: "T6_FOXGLOVE", category: "farm" as const, count: 72 },
    { itemId: "T5_EGG", category: "farm" as const, count: 18 },
    { itemId: "T6_ALCOHOL", category: "farm" as const, count: 18 },
    { itemId: "T1_ALCHEMY_EXTRACT_LEVEL1", category: "extract" as const, count: 45 },
  ];

  test("solo cuenta materiales de granja, ignora extractos", () => {
    const fee = farmStationFeePerBatch(heal6Ench1Materials, 235);
    // (235/1000) * 45 * (72+18+18) = 0.235 * 45 * 108
    expect(fee).toBeCloseTo(0.235 * 45 * 108, 5);
  });

  test("no depende del tier ni del encantamiento, solo de los materiales pasados", () => {
    const feeLowTier = farmStationFeePerBatch([{ itemId: "T2_AGARIC", category: "farm", count: 10 }], 235);
    const feeHighTierSameFarmCount = farmStationFeePerBatch(
      [
        { itemId: "T8_YARROW", category: "farm", count: 10 },
        { itemId: "T5_ALCHEMY_RARE_EAGLE", category: "artifact", count: 999 },
      ],
      235,
    );
    expect(feeLowTier).toBeCloseTo(feeHighTierSameFarmCount, 5);
  });

  test("artefactos no pagan fee", () => {
    const fee = farmStationFeePerBatch([{ itemId: "T5_ALCHEMY_RARE_EAGLE", category: "artifact", count: 500 }], 235);
    expect(fee).toBe(0);
  });

  test("escala linealmente con la tarifa", () => {
    const materials = [{ itemId: "T2_AGARIC", category: "farm" as const, count: 20 }];
    const feeAt100 = farmStationFeePerBatch(materials, 100);
    const feeAt200 = farmStationFeePerBatch(materials, 200);
    expect(feeAt200).toBeCloseTo(feeAt100 * 2, 5);
  });

  test("carne cuenta un factor fijo de 900 por unidad, sin importar el tier", () => {
    const t3 = farmStationFeePerBatch([{ itemId: "T3_MEAT", category: "meat" as const, count: 8 }], 235);
    const t8 = farmStationFeePerBatch([{ itemId: "T8_MEAT", category: "meat" as const, count: 8 }], 235);
    expect(t3).toBeCloseTo(0.235 * 900 * 8, 5);
    expect(t3).toBeCloseTo(t8, 5);
  });

  test("pescado usa el factor de su propio tier (T3/T5/T7/T8)", () => {
    const t3 = farmStationFeePerBatch([{ itemId: "T3_FISH_SALTWATER_ALL_RARE", category: "fish" as const, count: 10 }], 235);
    const t8 = farmStationFeePerBatch([{ itemId: "T8_FISH_SALTWATER_ALL_RARE", category: "fish" as const, count: 10 }], 235);
    expect(t3).toBeCloseTo(0.235 * 11.25 * 10, 5);
    expect(t8).toBeCloseTo(0.235 * 225 * 10, 5);
  });

  test("pescado en un tier sin factor documentado no rompe, cuenta como 0", () => {
    const fee = farmStationFeePerBatch([{ itemId: "T1_FISHCHOPS", category: "fish" as const, count: 10 }], 235);
    expect(fee).toBe(0);
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

describe("craftingStationFeePerBatch (armas y armaduras)", () => {
  // T6_MAIN_SWORD: 16 T6_METALBAR + 8 T6_LEATHER = 24 unidades, tier 6, sin encantar.
  test("con tier_artefacto 0 (equipo estandar), el multiplicador de artefacto es 1", () => {
    const fee = craftingStationFeePerBatch(24, 6, 0, 235);
    // (235/1000) * 18 * 24 * 1 * 2^(6-4) * 2^0 = 0.235*18*24*4
    expect(fee).toBeCloseTo(0.235 * 18 * 24 * 4, 5);
  });

  test("cada tier por encima de T4 duplica el fee", () => {
    const t4 = craftingStationFeePerBatch(24, 4, 0, 235);
    const t6 = craftingStationFeePerBatch(24, 6, 0, 235);
    expect(t6).toBeCloseTo(t4 * 4, 5);
  });

  test("cada nivel de encantamiento duplica el fee (con tier_artefacto 0)", () => {
    const ench0 = craftingStationFeePerBatch(24, 6, 0, 235);
    const ench1 = craftingStationFeePerBatch(24, 6, 1, 235);
    expect(ench1).toBeCloseTo(ench0 * 2, 5);
  });

  test("un tier de artefacto mayor a 0 sube el fee", () => {
    const sinArtefacto = craftingStationFeePerBatch(24, 6, 1, 235, 0);
    const conRunico = craftingStationFeePerBatch(24, 6, 1, 235, 1);
    expect(conRunico).toBeGreaterThan(sinArtefacto);
  });

  test("escala linealmente con la cantidad de materiales", () => {
    const fee24 = craftingStationFeePerBatch(24, 6, 0, 235);
    const fee48 = craftingStationFeePerBatch(48, 6, 0, 235);
    expect(fee48).toBeCloseTo(fee24 * 2, 5);
  });
});
