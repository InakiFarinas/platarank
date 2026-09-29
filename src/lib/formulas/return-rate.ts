// Production bonuses of the royal cities' crafting stations. Return rate = 1 - 1 / (1 + bonus); bonuses
// add up before the formula is applied (see siteBonus/siteReturnRate in craft-site.ts, which also
// covers guild hideouts). Verified in-game, see /metodologia.

export const BASE_STATION_BONUS = 0.18;
export const CITY_CRAFTING_SPECIALTY_BONUS = 0.15;
export const CITY_REFINING_SPECIALTY_BONUS = 0.4;
export const FOCUS_BONUS = 0.59;
