import { describe, expect, test } from "vitest";
import recipesJson from "@/data/generated/recipes.json";
import { searchItems, toSearchEntry, type SearchEntry } from "@/lib/item-search";

type Row = Parameters<typeof toSearchEntry>[0] & { enchant: number };
const index: SearchEntry[] = (recipesJson as Row[]).filter((r) => r.enchant === 0).map(toSearchEntry);

describe("búsqueda local de la calculadora", () => {
  test("ignora acentos y mayúsculas, y ordena por nombre y tier", () => {
    const hits = searchItems(index, "POCION de curacion", "es");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.nameEs.toLowerCase().includes("poción de curación"))).toBe(true);
    const tiers = hits.filter((h) => h.nameEs === hits[0].nameEs).map((h) => h.tier);
    expect(tiers).toEqual([...tiers].sort((a, b) => a - b));
  });

  test("en español también encuentra por el nombre en inglés; en inglés solo por el inglés", () => {
    expect(searchItems(index, "healing potion", "es").length).toBeGreaterThan(0);
    expect(searchItems(index, "curacion", "en")).toEqual([]);
  });

  test("menos de 2 letras no busca y el resultado se corta en 40", () => {
    expect(searchItems(index, "a", "es")).toEqual([]);
    expect(searchItems(index, "de", "es")).toHaveLength(40);
  });

  test("devuelve el tipo de estación completo y solo ítems base", () => {
    const [hit] = searchItems(index, "espada ancha", "es");
    expect(hit.stationType).toBe("gear");
    expect(hit.itemId).not.toContain("@");
  });
});
