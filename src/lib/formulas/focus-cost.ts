/** Focus cost efficiency (FCE) that halves a craft's focus cost -- the client's displayed units.
 * From gamedata.xml's ActionFocus costreductionconstant (1.00695555^100 = 2, dump points x100); the
 * fetch script fails if a patch changes it. */
export const FCE_PER_HALVING = 10000;

/** Focus one craft costs with the player's Destiny Board: base x 0.5^(FCE / 10,000). Not rounded:
 * the game rounds the total of a multi-craft order, not each craft (5 x 46.47 shows as 232, which
 * rounding per craft could never give -- checked in-game 2026-09-28). */
export function focusPerCraft(baseFocus: number, fce: number): number {
  return baseFocus * 0.5 ** (Math.max(0, fce) / FCE_PER_HALVING);
}
