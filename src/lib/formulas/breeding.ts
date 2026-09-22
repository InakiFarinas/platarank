// Criar la montura base en el pasto propio en lugar de comprarla ya crecida en el mercado: el
// jugador compra una cría al Mercader de granja por un precio fijo (no depende del mercado) y la
// alimenta hasta que crece. Solo caballo y buey tienen cría comprable a precio fijo en el dump de
// datos del juego -- las demás familias (ciervo gigante, lobo/jabalí/oso feroz, dragón de pantano,
// mamut, el conejo de evento) no tienen ese precio fijo ni receta de compra en items.json: se
// consiguen por otra vía (cría cruzada entre animales, eventos, drops), así que no hay un costo
// honesto que calcular para ellas y "criar por cuenta propia" no se les aplica.
//
// Cada entrada es real, no estimada: `babySilver` es el precio fijo en plata que cobra el Mercader
// de granja por la cría (items.json: <craftingrequirements silver="..."/> del `*_BABY`), y `feedQty`
// es cuántas unidades de alimento hacen falta para que crezca del todo (items.json: `consumption`
// `nutritionmax` del `*_BABY`, dividido por los 48 puntos de nutrición que da cada unidad de comida
// vegetal -- caballo y buey comen categoría "plants"). Fuente: ao-bin-dumps items.json, verificado
// contra el dump del 2026-09-22.
export type BreedingEntry = { babySilver: number; feedQty: number };

export const BREEDING_TABLE: Record<string, BreedingEntry> = {
  T3_FARM_HORSE_GROWN: { babySilver: 25_000, feedQty: 10 },
  T3_FARM_OX_GROWN: { babySilver: 25_000, feedQty: 10 },
  T4_FARM_HORSE_GROWN: { babySilver: 75_000, feedQty: 16 },
  T4_FARM_OX_GROWN: { babySilver: 75_000, feedQty: 16 },
  T5_FARM_HORSE_GROWN: { babySilver: 225_000, feedQty: 31 },
  T5_FARM_OX_GROWN: { babySilver: 225_000, feedQty: 31 },
  T6_FARM_HORSE_GROWN: { babySilver: 675_000, feedQty: 69 },
  T6_FARM_OX_GROWN: { babySilver: 675_000, feedQty: 69 },
  T7_FARM_HORSE_GROWN: { babySilver: 2_025_000, feedQty: 165 },
  T7_FARM_OX_GROWN: { babySilver: 2_025_000, feedQty: 165 },
  T8_FARM_HORSE_GROWN: { babySilver: 6_075_000, feedQty: 411 },
  T8_FARM_OX_GROWN: { babySilver: 6_075_000, feedQty: 411 },
};

/** Every crop here feeds "plants"-category animals at the same 48 nutrition per unit (verified in
 * the dump), so they're interchangeable -- the player buys whichever is cheapest that day. One per
 * tier so there's always a low-tier, cheap option regardless of what the player's city stocks. */
export const BREEDING_FEED_ITEMS = [
  "T1_CARROT",
  "T2_BEAN",
  "T3_WHEAT",
  "T4_TURNIP",
  "T5_CABBAGE",
  "T6_POTATO",
  "T7_CORN",
  "T8_PUMPKIN",
] as const;

export function isBreedable(grownItemId: string): boolean {
  return grownItemId in BREEDING_TABLE;
}

/** Silver cost of raising your own animal instead of buying it grown: the fixed baby price plus
 * feed at its cheapest available price. `null` when the item can't be bred (see module comment) or
 * no feed price is available yet -- callers fall back to the market price for the grown animal. */
export function breedingCostSilver(grownItemId: string, cheapestFeedPrice: number | null): number | null {
  const entry = BREEDING_TABLE[grownItemId];
  if (!entry || cheapestFeedPrice === null) return null;
  return Math.round(entry.babySilver + entry.feedQty * cheapestFeedPrice);
}
