// Market taxes: 4% sale tax with premium (8% without), 2.5% setup fee when placing an order
// (waived when matching an existing order instead). Different tools publish different constants
// for this -- these were verified against the live game, see /metodologia.
export const SALE_TAX_WITH_PREMIUM = 0.04;
export const SALE_TAX_WITHOUT_PREMIUM = 0.08;
export const SETUP_FEE = 0.025;

/** Total cut Albion takes off a sale: the sale tax plus the setup fee (assumes the player places
 * their own sell order rather than matching an existing one). The one place both the ranking and
 * the calculator get this number, so a rate change only needs editing here. */
export function saleTaxRate(premium: boolean): number {
  return (premium ? SALE_TAX_WITH_PREMIUM : SALE_TAX_WITHOUT_PREMIUM) + SETUP_FEE;
}

/** Fase 1 (ranking) assumes a premium crafter placing their own sell order. */
export function netSellMultiplier(premium = true): number {
  return 1 - saleTaxRate(premium);
}
