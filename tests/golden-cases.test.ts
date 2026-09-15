import { describe, test } from "vitest";
import goldenCases from "../fixtures/golden-cases.json";

// These run against real in-game captures only (see fixtures/golden-cases.json). Nothing here
// is invented: until a case is added, it stays a visible TODO instead of a fabricated pass.
type GoldenCase = {
  receta: string;
  estacion: string;
  tarifa_por_100_nutricion: number;
  foco: boolean;
  fee_esperado_por_lote: number;
  retorno_esperado_pct: number;
  fuente: string;
};

const cases = goldenCases as GoldenCase[];

describe("golden cases (capturas en juego)", () => {
  if (cases.length === 0) {
    test.todo("sin capturas todavia -- agregar a fixtures/golden-cases.json");
  }

  for (const c of cases) {
    test.todo(`${c.receta} @ ${c.estacion}: fee y retorno coinciden con el juego`);
  }
});
