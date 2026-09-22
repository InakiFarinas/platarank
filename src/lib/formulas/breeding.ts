// Criar la montura base en el pasto propio en lugar de comprarla ya crecida en el mercado. Dos
// formas, según la familia:
//
// 1. Caballo y buey: el jugador compra una cría al Mercader de granja por un precio fijo en plata
//    (no depende del mercado) y la alimenta hasta que crece.
// 2. El resto de las familias con receta de crecimiento (ciervo gigante, alce, lobo/jabalí/oso
//    feroz, dragón de pantano, mamut): la cría no tiene precio fijo de NPC en el dump del juego
//    (sin @silver, `unlockedtocraft` en falso para su compra directa) -- se consigue por cría
//    cruzada o se compra a otro jugador, así que se cotiza igual que cualquier otro material: la
//    oferta más barata entre las ciudades donde el jugador compra.
//
// Quedan afuera el dragón (Drake, come una categoría de alimento "mount" que no es un recurso de
// mercado normal) y el conejo de Pascua (evento limitado, alimento "chocolate"): ninguno tiene un
// costo honesto que calcular.
//
// Cada entrada es real, no estimada: `babySilver`/`babyItemId` viene de `craftingrequirements`/
// `@uniquename` del `*_BABY` en items.json, y `feedQty` es cuántas unidades de alimento hacen falta
// para que crezca del todo (`consumption.food.nutritionmax` del `*_BABY`, dividido por los 48 puntos
// de nutrición que da cada unidad vegetal o los 52 de cada unidad de carne, redondeado hacia arriba
// cuando no divide justo). Fuente: ao-bin-dumps items.json, verificado contra el dump del 2026-09-22.
export type BreedingEntry = {
  /** Precio fijo en plata del Mercader de granja. Excluyente con `babyItemId`. */
  babySilver?: number;
  /** Ítem de la cría, cotizado como cualquier material (sin precio fijo). Excluyente con `babySilver`. */
  babyItemId?: string;
  feedQty: number;
  feedCategory: "plants" | "meat";
};

export const BREEDING_TABLE: Record<string, BreedingEntry> = {
  T3_FARM_HORSE_GROWN: { babySilver: 25_000, feedQty: 10, feedCategory: "plants" },
  T3_FARM_OX_GROWN: { babySilver: 25_000, feedQty: 10, feedCategory: "plants" },
  T4_FARM_HORSE_GROWN: { babySilver: 75_000, feedQty: 16, feedCategory: "plants" },
  T4_FARM_OX_GROWN: { babySilver: 75_000, feedQty: 16, feedCategory: "plants" },
  T5_FARM_HORSE_GROWN: { babySilver: 225_000, feedQty: 31, feedCategory: "plants" },
  T5_FARM_OX_GROWN: { babySilver: 225_000, feedQty: 31, feedCategory: "plants" },
  T6_FARM_HORSE_GROWN: { babySilver: 675_000, feedQty: 69, feedCategory: "plants" },
  T6_FARM_OX_GROWN: { babySilver: 675_000, feedQty: 69, feedCategory: "plants" },
  T7_FARM_HORSE_GROWN: { babySilver: 2_025_000, feedQty: 165, feedCategory: "plants" },
  T7_FARM_OX_GROWN: { babySilver: 2_025_000, feedQty: 165, feedCategory: "plants" },
  T8_FARM_HORSE_GROWN: { babySilver: 6_075_000, feedQty: 411, feedCategory: "plants" },
  T8_FARM_OX_GROWN: { babySilver: 6_075_000, feedQty: 411, feedCategory: "plants" },

  T4_FARM_GIANTSTAG_GROWN: { babyItemId: "T4_FARM_GIANTSTAG_BABY", feedQty: 16, feedCategory: "plants" },
  T6_FARM_GIANTSTAG_MOOSE_GROWN: { babyItemId: "T6_FARM_GIANTSTAG_MOOSE_BABY", feedQty: 69, feedCategory: "plants" },
  T6_FARM_DIREWOLF_GROWN: { babyItemId: "T6_FARM_DIREWOLF_BABY", feedQty: 64, feedCategory: "meat" },
  T7_FARM_DIREBOAR_GROWN: { babyItemId: "T7_FARM_DIREBOAR_BABY", feedQty: 153, feedCategory: "meat" },
  T7_FARM_SWAMPDRAGON_GROWN: { babyItemId: "T7_FARM_SWAMPDRAGON_BABY", feedQty: 153, feedCategory: "meat" },
  T8_FARM_DIREBEAR_GROWN: { babyItemId: "T8_FARM_DIREBEAR_BABY", feedQty: 380, feedCategory: "meat" },
  T8_FARM_MAMMOTH_GROWN: { babyItemId: "T8_FARM_MAMMOTH_BABY", feedQty: 411, feedCategory: "plants" },
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

/** Meat feeds "meat"-category animals (the predators) at 52 nutrition per unit, same idea. */
export const BREEDING_MEAT_ITEMS = ["T3_MEAT", "T4_MEAT", "T5_MEAT", "T6_MEAT", "T7_MEAT", "T8_MEAT"] as const;

/** Every item id a caller needs a market price for to breed `grownItemId`: the baby (when it isn't
 * NPC-priced) plus the whole feed pool for its category -- callers fetch/aggregate these, breeding.ts
 * itself never touches market data. `null` when the grown item isn't breedable at all. */
export function breedingPriceInputs(grownItemId: string): { babyItemId: string | null; feedItems: readonly string[] } | null {
  const entry = BREEDING_TABLE[grownItemId];
  if (!entry) return null;
  return {
    babyItemId: entry.babyItemId ?? null,
    feedItems: entry.feedCategory === "meat" ? BREEDING_MEAT_ITEMS : BREEDING_FEED_ITEMS,
  };
}

export function isBreedable(grownItemId: string): boolean {
  return grownItemId in BREEDING_TABLE;
}

/** Every item id breeding math can ever need a market price for, across every breedable family --
 * the two feed pools plus every market-priced baby. Callers that decide which items to fetch prices
 * for (the station data loader, the calculator's item route, the alert re-pricer) add this set
 * regardless of which specific recipes are in play, since it's cheap and the alternative is silently
 * missing prices the moment a new breedable family is used. */
export const ALL_BREEDING_MARKET_ITEMS: readonly string[] = [
  ...BREEDING_FEED_ITEMS,
  ...BREEDING_MEAT_ITEMS,
  ...Object.values(BREEDING_TABLE)
    .map((e) => e.babyItemId)
    .filter((id): id is string => id !== undefined),
];

/** Silver cost of raising your own animal instead of buying it grown: the baby (fixed price, or its
 * cheapest market offer) plus feed at its cheapest available price. `null` when the item can't be
 * bred (see module comment) or a needed price isn't available yet -- callers fall back to the
 * market price for the grown animal. `babyMarketPrice` is ignored (and may be omitted) for the
 * horse/ox NPC-priced entries. */
export function breedingCostSilver(grownItemId: string, babyMarketPrice: number | null, cheapestFeedPrice: number | null): number | null {
  const entry = BREEDING_TABLE[grownItemId];
  if (!entry || cheapestFeedPrice === null) return null;
  const babyPrice = entry.babySilver ?? babyMarketPrice;
  if (babyPrice === null || babyPrice === undefined) return null;
  return Math.round(babyPrice + entry.feedQty * cheapestFeedPrice);
}
