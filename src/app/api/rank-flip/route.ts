import { NextResponse, type NextRequest } from "next/server";
import { ALL_LOCATIONS, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { DEFAULT_FLIP_PARAMS, FLIP_SORT_ACCESSORS, type FlipParams, type FlipSortKey } from "@/lib/flip-math";
import type { FlipFilterParams } from "@/lib/flip-filters";
import { rankFlip, FLIP_ROW_LIMIT } from "@/lib/server/flip-data";
import { loadFlipMarketMemo } from "@/lib/server/shared-cache";

// ~7,200 flippable items: like /api/rank for equipo, the page ships the default snapshot and this
// route recomputes server-side whenever the player changes buy/sell cities or a filter -- changing
// either city set changes EVERY row's best price, not just narrows what's shown.
export const maxDuration = 60;

const isLocation = (v: unknown): v is Location => typeof v === "string" && (ALL_LOCATIONS as readonly string[]).includes(v);
const num = (v: unknown, fallback: number, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

// Same rate-limit/memoization shape as /api/rank -- see that file's comment for the rationale.
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
  if (!body || typeof body !== "object") return NextResponse.json({ error: "bad request" }, { status: 400 });

  const p = (body.params ?? {}) as Record<string, unknown>;
  const f = (body.filters ?? {}) as Record<string, unknown>;

  const params: FlipParams = {
    // Black Market has no sell listings to buy against -- filtered out even if the client sent it.
    buyCities: Array.isArray(p.buyCities) ? p.buyCities.filter(isLocation).filter((c) => (REAL_CITIES as readonly string[]).includes(c)) : DEFAULT_FLIP_PARAMS.buyCities,
    sellCities: Array.isArray(p.sellCities) ? p.sellCities.filter(isLocation) : DEFAULT_FLIP_PARAMS.sellCities,
    marketShare: num(p.marketShare, DEFAULT_FLIP_PARAMS.marketShare, 0, 1),
    buyMethodPref: p.buyMethodPref === "instant" || p.buyMethodPref === "order" ? p.buyMethodPref : "auto",
  };
  const filters: FlipFilterParams = {
    nameQuery: typeof f.nameQuery === "string" ? f.nameQuery.slice(0, 80) : "",
    minMarginPct: typeof f.minMarginPct === "number" ? f.minMarginPct : null,
    minVolume: typeof f.minVolume === "number" ? f.minVolume : null,
    maxAgeHours: typeof f.maxAgeHours === "number" ? f.maxAgeHours : null,
  };

  const s = (body.sort ?? {}) as Record<string, unknown>;
  const sort = {
    key: typeof s.key === "string" && s.key in FLIP_SORT_ACCESSORS ? (s.key as FlipSortKey) : "platinumPerDay",
    desc: s.desc !== false,
  };

  const key = JSON.stringify([[...params.buyCities].sort(), [...params.sellCities].sort(), params.marketShare, params.buyMethodPref, filters, sort]);
  const cached = results.get(key);
  if (cached && Date.now() - cached.at < RESULT_TTL_MS) return NextResponse.json(cached.body);

  const market = await loadFlipMarketMemo();
  const ranked = rankFlip(market, params, filters, FLIP_ROW_LIMIT, sort);
  results.set(key, { at: Date.now(), body: ranked });
  if (results.size > RESULT_MAX_ENTRIES) results.delete(results.keys().next().value as string);
  return NextResponse.json(ranked);
}
