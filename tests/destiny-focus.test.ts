import { describe, expect, test } from "vitest";
import recipesJson from "@/data/generated/recipes.json";
import { recipeFce, relevantNodes, type DestinyLevels } from "@/lib/destiny-focus";
import { focusPerCraft } from "@/lib/formulas/focus-cost";
import type { Recipe } from "@/lib/db/schema";

const recipes = new Map((recipesJson as unknown as Recipe[]).map((r) => [r.itemId, r]));
const get = (id: string) => recipes.get(id)!;

// A real player's board (in-game screenshot, 2026-09-28): Alchemist mastery 100 and these potion
// specs. The client showed "+1789" for potions & alcohol and "+3750" for poison.
const alchemist: DestinyLevels = {
  FARM_ALCHEMIST: 100,
  FARM_ALCHEMIST_HEAL: 33,
  FARM_ALCHEMIST_REVIVE: 3,
  FARM_ALCHEMIST_STONESKIN: 6,
  FARM_ALCHEMIST_COOLDOWN: 15,
  FARM_ALCHEMIST_MOBRESET: 10,
  FARM_ALCHEMIST_ACID: 1,
  FARM_ALCHEMIST_BERSERK: 1,
  FARM_ALCHEMIST_LAVA: 26,
  FARM_ALCHEMIST_GATHER: 1,
  FARM_ALCHEMIST_TORNADO: 6,
};

describe("foco con el tablero del destino", () => {
  test("coincide con el juego: 5 crafts de veneno T4 cuestan 232 de foco", () => {
    const poison = get("T4_POTION_COOLDOWN");
    expect(poison.craftingFocus).toBe(84);
    const nodes = relevantNodes(poison, "es");
    const fce = recipeFce(nodes, alchemist);
    // 3,000 mastery + 1,788.75 potion category (the client rounds it to +1789) + 3,750 poison.
    expect(fce).toBeCloseTo(8538.75, 6);
    expect(Math.round(5 * focusPerCraft(poison.craftingFocus, fce))).toBe(232);
  });

  test("la categoría de pociones suma lo que muestra el juego (+1789) sin contar la maestría", () => {
    const heal = get("T4_POTION_HEAL");
    const nodes = relevantNodes(heal, "es").filter((n) => n.kind === "spec" && n.id !== "FARM_ALCHEMIST_HEAL");
    const siblings = recipeFce(nodes, alchemist) + 33 * 22.5; // the heal spec's own category share
    expect(Math.round(siblings)).toBe(1789);
  });

  test("la maestría va primero y la especialización propia suma 250 por nivel", () => {
    const nodes = relevantNodes(get("T6_MAIN_SWORD"), "es");
    expect(nodes[0].kind).toBe("mastery");
    expect(nodes.find((n) => n.id === "CRAFT_SWORDS_SWORD")!.fcePerLevel).toBe(280); // 250 own + 30 category
    expect(nodes.find((n) => n.id === "CRAFT_SWORDS")!.fcePerLevel).toBe(30);
  });

  test("refinado: cada nodo de tier da 250 a su tier y 30 a todos; spec completa T4 = 54 -> 3,4", () => {
    const bar = get("T4_METALBAR");
    const nodes = relevantNodes(bar, "es");
    const full = Object.fromEntries(nodes.map((n) => [n.id, 100]));
    expect(recipeFce(nodes, full)).toBe(40000);
    expect(focusPerCraft(bar.craftingFocus, 40000)).toBeCloseTo(3.375, 6);
  });

  test("monturas no tienen nodos que bajen el foco; niveles fuera de rango se recortan", () => {
    expect(relevantNodes(get("T5_MOUNT_ARMORED_HORSE"), "es")).toEqual([]);
    const nodes = relevantNodes(get("T4_POTION_COOLDOWN"), "es");
    expect(recipeFce(nodes, { FARM_ALCHEMIST: 500 })).toBe(3000);
    expect(recipeFce(nodes, { FARM_ALCHEMIST: -5 })).toBe(0);
  });
});
