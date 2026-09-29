import { describe, expect, test } from "vitest";
import { biomeSpecialties, siteBonus, siteReturnRate, type HideoutSite } from "@/lib/formulas/craft-site";
import { computeCraft, type CraftParams } from "@/lib/craft-calc";
import type { Recipe } from "@/lib/db/schema";

const mace = { stationType: "gear", craftingCategory: "mace" };
const sword = { stationType: "gear", craftingCategory: "sword" };
const potion = { stationType: "alchemy", craftingCategory: "potion" };
const planks = { stationType: "refining", craftingCategory: "wood" };
const hideout = (zone: number, power: number, extra: Partial<HideoutSite> = {}): HideoutSite => ({ kind: "hideout", zone, biome: "SWAMP", power, ...extra });

describe("bono por lugar de crafteo", () => {
  test("ciudad: 18% base y +15% en la ciudad con la especialidad (Thetford hace mazas)", () => {
    expect(siteBonus(undefined, mace, "Lymhurst").bonus).toBeCloseTo(0.18, 10);
    expect(siteBonus(undefined, mace, "Thetford")).toMatchObject({ specialty: true, cityKind: "crafting" });
    expect(siteBonus(undefined, mace, "Thetford").bonus).toBeCloseTo(0.33, 10);
  });

  test("pantano = especialidades de Thetford, en todas las calidades", () => {
    expect([...biomeSpecialties("SWAMP")].sort()).toEqual(["cloth_helmet", "firestaff", "leather_armor", "mace", "naturestaff"]);
  });

  test("escondite Q6 nivel 9, especialidad: 26% general + 26% zona + 30% especialista = 82%", () => {
    const b = siteBonus(hideout(6, 9), mace, "Brecilien");
    expect(b.specialty).toBe(true);
    expect(b.bonus).toBeCloseTo(0.82, 10);
    expect(siteReturnRate(b.bonus, false)).toBeCloseTo(0.4505, 4);
    expect(siteReturnRate(b.bonus, true)).toBeCloseTo(0.5851, 4);
  });

  test("escondite fuera de especialidad: solo el bono general del nivel de poder, sin 18% base", () => {
    expect(siteBonus(hideout(6, 9), sword, "Brecilien")).toEqual({ bonus: 0.26, specialty: false });
    expect(siteBonus(hideout(6, 9), potion, "Brecilien").bonus).toBeCloseTo(0.26, 10);
    expect(siteBonus(hideout(6, 1), sword, "Brecilien").bonus).toBe(0);
  });

  test("refinar en escondite: 15% fijo en zona negra, el nivel de poder no cambia nada", () => {
    expect(siteBonus(hideout(6, 9), planks, "Brecilien").bonus).toBeCloseTo(0.15, 10);
    expect(siteBonus(hideout(1, 1), planks, "Brecilien").bonus).toBeCloseTo(0.15, 10);
  });

  test("camino de Avalon: 10% al refinado (+10% en su recurso) y 1% + especialista en sus especialidades", () => {
    expect(siteBonus(hideout(0, 5), planks, "Brecilien").bonus).toBeCloseTo(0.1, 10);
    expect(siteBonus(hideout(0, 5, { roadSpecialty: true }), planks, "Brecilien").bonus).toBeCloseTo(0.2, 10);
    expect(siteBonus(hideout(0, 5), mace, "Brecilien").bonus).toBeCloseTo(0.18, 10);
    expect(siteBonus(hideout(0, 5, { roadSpecialty: true }), mace, "Brecilien").bonus).toBeCloseTo(0.18 + 0.01 + 0.15, 10);
  });

  test("un escondite inválido en un plan guardado se lee como ciudad en vez de romper", () => {
    const broken = { kind: "hideout", zone: 9, biome: "LAVA", power: 99 } as unknown as HideoutSite;
    expect(siteBonus(broken, mace, "Lymhurst").bonus).toBeCloseTo(0.18, 10);
  });
});

describe("computeCraft con escondite", () => {
  const recipe: Recipe = {
    itemId: "T6_MAIN_MACE",
    baseItemId: "T6_MAIN_MACE",
    nameEs: "Maza",
    nameEn: "Mace",
    namePt: null,
    tier: 6,
    enchant: 0,
    stationType: "gear",
    craftingCategory: "mace",
    maxQualityLevel: 5,
    batchSize: 1,
    craftingFocus: 1000,
    materials: [{ itemId: "T6_METALBAR", count: 16, category: "other", nameEs: "Lingote", nameEn: "Metal Bar" }],
    materialItemValue: "1024",
  };
  const p: CraftParams = { qty: 1, premium: true, blackMarket: false, quality: 1, craftCity: "Thetford", focus: false, feeRate: 0, extraCost: 0, sellOverride: 10000, matOverrides: { T6_METALBAR: 100 } };

  test("el escondite reemplaza el bono de la ciudad elegida, que deja de contar como especialidad", () => {
    const city = computeCraft(recipe, {}, p);
    const hide = computeCraft(recipe, {}, { ...p, site: hideout(6, 9) });
    expect(city.specActive).toBe(true);
    expect(hide.specActive).toBe(false);
    expect(hide.siteSpecialty).toBe(true);
    expect(hide.rrr).toBeCloseTo(1 - 1 / 1.82, 10);
    expect(hide.materialsTotal).toBeCloseTo(16 * 100 * (1 / 1.82), 6);
    expect(hide.materialsTotal).toBeLessThan(city.materialsTotal);
  });

  test("un plan guardado antes de los escondites (sin site) sigue siendo de ciudad", () => {
    expect(computeCraft(recipe, {}, p).rrr).toBeCloseTo(1 - 1 / 1.33, 10);
  });
});
