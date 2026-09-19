import { NextResponse, type NextRequest } from "next/server";
import { ALL_LOCATIONS, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { DEFAULT_PARAMS, type RecipeMathParams } from "@/lib/recipe-math";
import type { FilterParams } from "@/lib/recipe-filters";
import { loadStationDataCached, rankStation, ROW_LIMIT } from "@/lib/server/station-data";

// /equipo has ~5,700 recipes: shipping all of them (plus their market data) to the browser is a
// ~50MB page. Instead the page ships the default top rows and this route recomputes server-side
// whenever the player changes an assumption or filter.
export const maxDuration = 60;

const isLocation = (v: unknown): v is Location => typeof v === "string" && (ALL_LOCATIONS as readonly string[]).includes(v);
const num = (v: unknown, fallback: number, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (body.station !== "gear") return NextResponse.json({ error: "unsupported station" }, { status: 400 });

  const p = (body.params ?? {}) as Record<string, unknown>;
  const f = (body.filters ?? {}) as Record<string, unknown>;

  const params: RecipeMathParams = {
    buyCities: Array.isArray(p.buyCities) ? p.buyCities.filter(isLocation).filter((c) => (REAL_CITIES as readonly string[]).includes(c)) : DEFAULT_PARAMS.buyCities,
    sellCities: Array.isArray(p.sellCities) ? p.sellCities.filter(isLocation) : DEFAULT_PARAMS.sellCities,
    marketShare: num(p.marketShare, DEFAULT_PARAMS.marketShare, 0, 1),
    focus: p.focus === true,
    stationRatePer100Nutrition: num(p.stationRatePer100Nutrition, DEFAULT_PARAMS.stationRatePer100Nutrition, 0, 100000),
    craftCity: isLocation(p.craftCity) ? p.craftCity : DEFAULT_PARAMS.craftCity,
  };
  const filters: FilterParams = {
    nameQuery: typeof f.nameQuery === "string" ? f.nameQuery.slice(0, 80) : "",
    maxAgeHours: typeof f.maxAgeHours === "number" ? f.maxAgeHours : null,
    minVolume: typeof f.minVolume === "number" ? f.minVolume : null,
  };

  const data = await loadStationDataCached("gear");
  return NextResponse.json(rankStation(data, params, filters, ROW_LIMIT));
}
