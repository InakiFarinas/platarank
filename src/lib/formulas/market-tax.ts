// Market taxes: 4% sale tax with premium (8% without), 2.5% setup fee when placing an order
// (waived when matching an existing order instead). Different tools publish different constants
// for this -- these need verification against the live game before launch, see /metodologia.
export const SALE_TAX_WITH_PREMIUM = 0.04;
export const SETUP_FEE = 0.025;

/** Fase 1 assumes a premium crafter placing their own sell order (tax + setup fee both apply). */
export function netSellMultiplier(): number {
  return 1 - SALE_TAX_WITH_PREMIUM - SETUP_FEE;
}
