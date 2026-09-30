// A single trade in 30 days still passes `avgDailyVolume30d > 0` and can carry a fantasy price
// into a blend or a flip. Require at least a few distinct days with a trade before a quote counts
// as liquid -- shared by crafting (recipe-math.ts) and flipping (flip-math.ts) so both rubros use
// literally the same bar, not two copies of the same magic number.
export const MIN_LIQUID_DAYS = 3;

export function isLiquid(p: { avgDailyVolume30d: number; daysWithVolume30d: number }): boolean {
  return p.avgDailyVolume30d > 0 && p.daysWithVolume30d >= MIN_LIQUID_DAYS;
}
