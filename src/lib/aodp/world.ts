import { BLACK_MARKET, REAL_CITIES, type Location } from "./cities";

const WORLD_URL = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/world.json";

type WorldEntry = { Index: string; UniqueName: string };

// AODP's daily dump keys market_history.location by the trading-post cluster id ("<City> Market"),
// NOT the open-world city id craftingmodifiers.xml uses -- e.g. Caerleon's open-world id (3003) is
// where Black Market trades land, while the real Caerleon market is a separate cluster (3005).
// Confirmed 2026-09-16 by cross-checking a live dump row against /stats/history for the same
// item/quality/day: a row at location 3003 matched Black Market's item_count/avg_price exactly,
// and a row at 3005 matched Caerleon's.
const MARKET_SUFFIX = " Market";

/** Resolves each real city's trading-post cluster id (and Black Market's, which is Caerleon's
 * open-world id) fresh from world.json, so a game-side renumber surfaces as a loud error instead
 * of a silently wrong city. */
export async function fetchClusterIdToLocation(): Promise<Map<string, Location>> {
  const res = await fetch(WORLD_URL);
  if (!res.ok) throw new Error(`Failed to download world.json: ${res.status}`);
  const worldJson = (await res.json()) as WorldEntry[];

  const clusterIdToLocation = new Map<string, Location>();
  for (const city of REAL_CITIES) {
    const marketName = `${city}${MARKET_SUFFIX}`;
    const entry = worldJson.find((w) => w.UniqueName === marketName && /^\d+$/.test(w.Index));
    if (!entry) throw new Error(`"${marketName}" not found in world.json -- did the game rename or remove it?`);
    clusterIdToLocation.set(entry.Index, city);
  }

  const caerleon = worldJson.find((w) => w.UniqueName === "Caerleon" && /^\d+$/.test(w.Index));
  if (!caerleon) throw new Error(`"Caerleon" not found in world.json -- did the game rename or remove it?`);
  clusterIdToLocation.set(caerleon.Index, BLACK_MARKET);

  return clusterIdToLocation;
}
