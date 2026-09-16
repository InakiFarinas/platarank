// Return rate: retorno = 1 - 1 / (1 + bonus). Bonuses stack additively before applying the formula.
// Source: verified in-game mechanic, see /metodologia (pending sources + dated verification).

export type ReturnRateInputs = {
  cityCraftingSpecialty: boolean;
  cityRefiningSpecialty: boolean;
  focus: boolean;
};

export const BASE_STATION_BONUS = 0.18;
export const CITY_CRAFTING_SPECIALTY_BONUS = 0.15;
export const CITY_REFINING_SPECIALTY_BONUS = 0.4;
export const FOCUS_BONUS = 0.59;

export function returnRateBonus(inputs: ReturnRateInputs): number {
  let bonus = BASE_STATION_BONUS;
  if (inputs.cityCraftingSpecialty) bonus += CITY_CRAFTING_SPECIALTY_BONUS;
  if (inputs.cityRefiningSpecialty) bonus += CITY_REFINING_SPECIALTY_BONUS;
  if (inputs.focus) bonus += FOCUS_BONUS;
  return bonus;
}

export function returnRate(inputs: ReturnRateInputs): number {
  const bonus = returnRateBonus(inputs);
  return 1 - 1 / (1 + bonus);
}
