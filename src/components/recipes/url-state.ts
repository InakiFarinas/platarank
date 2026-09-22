import { ALL_LOCATIONS, type Location } from "@/lib/aodp/cities";
import { DEFAULT_PARAMS, type RecipeMathParams } from "@/lib/recipe-math";
import { DEFAULT_FILTERS, type FilterParams } from "./controls";

/** Reflects the current filters/params in the address bar so a tuned session is bookmarkable and
 * shareable -- read once on mount (client-only, so the server-rendered defaults still match on
 * first paint) and rewritten in place afterward. Deliberately bypasses next/navigation's router:
 * this is a URL mirror of client state, not a page transition, and going through the router would
 * risk re-triggering the server component's data fetch for a purely cosmetic address-bar update. */

function citiesToParam(cities: Location[]): string {
  return cities.join(",");
}

function citiesFromParam(raw: string): Location[] {
  const set = new Set(ALL_LOCATIONS as readonly string[]);
  return raw
    .split(",")
    .filter((c) => set.has(c))
    .map((c) => c as Location);
}

export function writeStateToUrl(params: RecipeMathParams, filters: FilterParams): void {
  const q = new URLSearchParams();
  if (citiesToParam(params.buyCities) !== citiesToParam(DEFAULT_PARAMS.buyCities)) q.set("comprar", citiesToParam(params.buyCities));
  if (citiesToParam(params.sellCities) !== citiesToParam(DEFAULT_PARAMS.sellCities)) q.set("vender", citiesToParam(params.sellCities));
  if (params.marketShare !== DEFAULT_PARAMS.marketShare) q.set("cuota", String(Math.round(params.marketShare * 100)));
  if (params.focus !== DEFAULT_PARAMS.focus) q.set("foco", params.focus ? "1" : "0");
  if (params.stationRatePer100Nutrition !== DEFAULT_PARAMS.stationRatePer100Nutrition) {
    q.set("tarifa", String(params.stationRatePer100Nutrition));
  }
  if (params.craftCity !== DEFAULT_PARAMS.craftCity) q.set("craftea", params.craftCity);
  if (params.breedOwnMount !== DEFAULT_PARAMS.breedOwnMount) q.set("cria", params.breedOwnMount ? "1" : "0");
  if (filters.nameQuery !== DEFAULT_FILTERS.nameQuery) q.set("nombre", filters.nameQuery);
  if (filters.maxAgeHours !== DEFAULT_FILTERS.maxAgeHours) q.set("antiguedad", String(filters.maxAgeHours));
  if (filters.minVolume !== DEFAULT_FILTERS.minVolume) q.set("volumen", String(filters.minVolume));

  const search = q.toString();
  const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

export function parseStateFromUrl(): { params: RecipeMathParams; filters: FilterParams } | null {
  const q = new URLSearchParams(window.location.search);
  if ([...q.keys()].length === 0) return null;

  const params: RecipeMathParams = { ...DEFAULT_PARAMS };
  const filters: FilterParams = { ...DEFAULT_FILTERS };

  if (q.has("comprar")) params.buyCities = citiesFromParam(q.get("comprar")!);
  if (q.has("vender")) params.sellCities = citiesFromParam(q.get("vender")!);
  if (q.has("cuota")) {
    const v = Number(q.get("cuota"));
    if (Number.isFinite(v)) params.marketShare = v / 100;
  }
  if (q.has("foco")) params.focus = q.get("foco") === "1";
  if (q.has("tarifa")) {
    const v = Number(q.get("tarifa"));
    if (Number.isFinite(v)) params.stationRatePer100Nutrition = v;
  }
  if (q.has("craftea") && (ALL_LOCATIONS as readonly string[]).includes(q.get("craftea")!)) {
    params.craftCity = q.get("craftea") as Location;
  }
  if (q.has("cria")) params.breedOwnMount = q.get("cria") === "1";
  if (q.has("nombre")) filters.nameQuery = q.get("nombre")!;
  if (q.has("antiguedad")) {
    const v = Number(q.get("antiguedad"));
    if (Number.isFinite(v)) filters.maxAgeHours = v;
  }
  if (q.has("volumen")) {
    const v = Number(q.get("volumen"));
    if (Number.isFinite(v)) filters.minVolume = v;
  }

  return { params, filters };
}
