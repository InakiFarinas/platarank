/** Focus cost efficiency (FCE) that halves a craft's focus cost -- the client's displayed units.
 * From gamedata.xml's ActionFocus costreductionconstant (1.00695555^100 = 2, dump points x100); the
 * fetch script fails if a patch changes it. */
export const FCE_PER_HALVING = 10000;

/** Focus with the player's Destiny Board: base x 0.5^(FCE / 10,000), where base is the focus of
 * what's being crafted (items.json's @craftingfocus is per unit produced, so a 5-potion craft's base
 * is 5 x @craftingfocus). Not rounded: the game rounds the order's total (checked in-game
 * 2026-09-28: 5 poison potions, 5 x 84 x 0.553 = 232.3, shown as 232). */
export function focusPerCraft(baseFocus: number, fce: number): number {
  return baseFocus * 0.5 ** (Math.max(0, fce) / FCE_PER_HALVING);
}
