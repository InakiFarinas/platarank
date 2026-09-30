import { ALL_LOCATIONS, type Location } from "@/lib/aodp/cities";
import { DEFAULT_FLIP_PARAMS, type FlipParams } from "@/lib/flip-math";
import { DEFAULT_FLIP_FILTERS, type FlipFilterParams } from "@/lib/flip-filters";

/** Same URL-mirror convention as /equipo's url-state.ts (see that file's comment): a client-only
 * read on mount, then a plain history.replaceState on every change, bypassing next/navigation. */

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

export function writeStateToUrl(params: FlipParams, filters: FlipFilterParams): void {
  const q = new URLSearchParams();
  if (citiesToParam(params.buyCities) !== citiesToParam(DEFAULT_FLIP_PARAMS.buyCities)) q.set("comprar", citiesToParam(params.buyCities));
  if (citiesToParam(params.sellCities) !== citiesToParam(DEFAULT_FLIP_PARAMS.sellCities)) q.set("vender", citiesToParam(params.sellCities));
  if (params.marketShare !== DEFAULT_FLIP_PARAMS.marketShare) q.set("cuota", String(Math.round(params.marketShare * 100)));
  if (filters.nameQuery !== DEFAULT_FLIP_FILTERS.nameQuery) q.set("nombre", filters.nameQuery);
  if (filters.minMarginPct !== DEFAULT_FLIP_FILTERS.minMarginPct) q.set("margen", String(filters.minMarginPct));
  if (filters.minVolume !== DEFAULT_FLIP_FILTERS.minVolume) q.set("volumen", String(filters.minVolume));
  if (filters.maxAgeHours !== DEFAULT_FLIP_FILTERS.maxAgeHours) q.set("antiguedad", String(filters.maxAgeHours));

  const search = q.toString();
  const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

export function parseStateFromUrl(): { params: FlipParams; filters: FlipFilterParams } | null {
  const q = new URLSearchParams(window.location.search);
  if ([...q.keys()].length === 0) return null;

  const params: FlipParams = { ...DEFAULT_FLIP_PARAMS };
  const filters: FlipFilterParams = { ...DEFAULT_FLIP_FILTERS };

  if (q.has("comprar")) params.buyCities = citiesFromParam(q.get("comprar")!);
  if (q.has("vender")) params.sellCities = citiesFromParam(q.get("vender")!);
  if (q.has("cuota")) {
    const v = Number(q.get("cuota"));
    if (Number.isFinite(v)) params.marketShare = v / 100;
  }
  if (q.has("nombre")) filters.nameQuery = q.get("nombre")!;
  if (q.has("margen")) {
    const v = Number(q.get("margen"));
    if (Number.isFinite(v)) filters.minMarginPct = v;
  }
  if (q.has("volumen")) {
    const v = Number(q.get("volumen"));
    if (Number.isFinite(v)) filters.minVolume = v;
  }
  if (q.has("antiguedad")) {
    const v = Number(q.get("antiguedad"));
    if (Number.isFinite(v)) filters.maxAgeHours = v;
  }

  return { params, filters };
}
