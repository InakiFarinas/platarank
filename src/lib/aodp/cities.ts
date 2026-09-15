export const REAL_CITIES = [
  "Brecilien",
  "Caerleon",
  "Martlock",
  "Lymhurst",
  "Bridgewatch",
  "Fort Sterling",
  "Thetford",
] as const;

export const BLACK_MARKET = "Black Market" as const;

export const ALL_LOCATIONS = [...REAL_CITIES, BLACK_MARKET] as const;

export type City = (typeof REAL_CITIES)[number];
export type Location = (typeof ALL_LOCATIONS)[number];

export const AODP_SERVERS = {
  americas: "west",
  europe: "europe",
  asia: "east",
} as const;

export type AodpServer = (typeof AODP_SERVERS)[keyof typeof AODP_SERVERS];

export function aodpBaseUrl(server: AodpServer): string {
  return `https://${server}.albion-online-data.com`;
}
