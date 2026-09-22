import { NextResponse, type NextRequest } from "next/server";
import { ALL_LOCATIONS, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { DEFAULT_PARAMS, SORT_ACCESSORS, type RecipeMathParams, type SortKey } from "@/lib/recipe-math";
import type { FilterParams } from "@/lib/recipe-filters";
import { loadStationDataCached, rankStation, ROW_LIMIT } from "@/lib/server/station-data";

// /equipo has ~5,700 recipes: shipping all of them (plus their market data) to the browser is a
// ~50MB page. Instead the page ships the default top rows and this route recomputes server-side
// whenever the player changes an assumption or filter.
export const maxDuration = 60;

const isLocation = (v: unknown): v is Location => typeof v === "string" && (ALL_LOCATIONS as readonly string[]).includes(v);
const num = (v: unknown, fallback: number, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

// Ranking is public and CPU-heavy (every recipe is recomputed), so identical requests are served
// from memory and each client is limited. Both are per-instance best effort on serverless; put a
// platform rate-limit rule in front for a hard guarantee.
const RESULT_TTL_MS = 5 * 60 * 1000;
const RESULT_MAX_ENTRIES = 100;
const results = new Map<string, { at: number; body: { rows: unknown[]; total: number } }>();

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const MAX_BODY_BYTES = 8_000;
const clients = new Map<string, { count: number; resetAt: number }>();

function limited(ip: string): number {
  const now = Date.now();
  const entry = clients.get(ip);
  if (!entry || entry.resetAt <= now) {
    clients.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (clients.size > 5000) clients.delete(clients.keys().next().value as string);
    return 0;
  }
  entry.count++;
  return entry.count > MAX_PER_WINDOW ? Math.ceil((entry.resetAt - now) / 1000) : 0;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const retryAfter = limited(ip);
  if (retryAfter > 0) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || body.station !== "gear") return NextResponse.json({ error: "unsupported station" }, { status: 400 });

  const p = (body.params ?? {}) as Record<string, unknown>;
  const f = (body.filters ?? {}) as Record<string, unknown>;

  const params: RecipeMathParams = {
    buyCities: Array.isArray(p.buyCities) ? p.buyCities.filter(isLocation).filter((c) => (REAL_CITIES as readonly string[]).includes(c)) : DEFAULT_PARAMS.buyCities,
    sellCities: Array.isArray(p.sellCities) ? p.sellCities.filter(isLocation) : DEFAULT_PARAMS.sellCities,
    marketShare: num(p.marketShare, DEFAULT_PARAMS.marketShare, 0, 1),
    focus: p.focus === true,
    stationRatePer100Nutrition: num(p.stationRatePer100Nutrition, DEFAULT_PARAMS.stationRatePer100Nutrition, 0, 100000),
    craftCity: isLocation(p.craftCity) ? p.craftCity : DEFAULT_PARAMS.craftCity,
    // Gear never crafts a mount, so this never actually applies here; kept only for type
    // completeness with the shared RecipeMathParams shape.
    breedOwnMount: false,
  };
  const filters: FilterParams = {
    nameQuery: typeof f.nameQuery === "string" ? f.nameQuery.slice(0, 80) : "",
    maxAgeHours: typeof f.maxAgeHours === "number" ? f.maxAgeHours : null,
    minVolume: typeof f.minVolume === "number" ? f.minVolume : null,
  };

  const s = (body.sort ?? {}) as Record<string, unknown>;
  const sort = {
    key: typeof s.key === "string" && s.key in SORT_ACCESSORS ? (s.key as SortKey) : "platinumPerDay",
    desc: s.desc !== false,
  };

  // Key on the sanitized inputs (not the raw body) so equivalent requests share one result.
  const key = JSON.stringify([[...params.buyCities].sort(), [...params.sellCities].sort(), params.marketShare, params.focus, params.stationRatePer100Nutrition, params.craftCity, filters, sort]);
  const cached = results.get(key);
  if (cached && Date.now() - cached.at < RESULT_TTL_MS) return NextResponse.json(cached.body);

  const data = await loadStationDataCached("gear");
  const ranked = rankStation(data, params, filters, ROW_LIMIT, sort);
  results.set(key, { at: Date.now(), body: ranked });
  if (results.size > RESULT_MAX_ENTRIES) results.delete(results.keys().next().value as string);
  return NextResponse.json(ranked);
}
