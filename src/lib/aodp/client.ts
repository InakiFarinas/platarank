import { ALL_LOCATIONS, aodpBaseUrl, type AodpServer } from "./cities";
import type { AodpHistoryRow, AodpPriceRow } from "./types";

// AODP rate limits (verified against albion-online-data.com/api, 2026-09-16): 180 req/min AND
// 300 req/5min. The 5-minute cap is the one that binds in steady state -- 300/5min is only 60/min
// sustained, well under the 180/min ceiling. A flat 400ms gap (150/min) satisfies the 1-minute cap
// but blows through 300 in under 2.5 minutes of continuous fetching, which is exactly what a
// multi-thousand-item ingest run does. A real sliding-window limiter tracks both windows at once:
// it lets short bursts run up to 180/min the way a flat gap can't, but never lets the trailing
// 5-minute count exceed 300, so a long run settles at the true 60/min sustained rate instead of
// 429ing partway through.
const LIMIT_PER_MINUTE = 180;
const WINDOW_1M_MS = 60_000;
const LIMIT_PER_5MINUTES = 300;
const WINDOW_5M_MS = 5 * 60_000;
const MAX_RETRIES = 5;
const MAX_URL_LENGTH = 4000; // AODP's documented limit is 4096; leave margin for the path+query

const CONTACT = process.env.AODP_CONTACT ?? "unknown";
const USER_AGENT = `PlataRank/0.1 (+https://github.com/InakiFarinas/platarank; contact: ${CONTACT})`;

// Timestamps of every request sent within the trailing 5-minute window (also covers the 1-minute
// window, which is a subset of it). All callers -- even ones invoked concurrently via Promise.all
// -- funnel through this single promise chain, so the window is real regardless of how many
// logical fetch "streams" are in flight; without it, concurrent callers would each check the
// window before any of them records their own request and fire in a burst.
const requestTimestamps: number[] = [];
let queueTail: Promise<void> = Promise.resolve();

function throttledFetch(url: string): Promise<Response> {
  const result = queueTail.then(() => doFetch(url));
  queueTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function waitForSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (requestTimestamps.length > 0 && now - requestTimestamps[0] >= WINDOW_5M_MS) {
      requestTimestamps.shift();
    }
    const countIn1m = requestTimestamps.filter((t) => now - t < WINDOW_1M_MS).length;
    const countIn5m = requestTimestamps.length;
    if (countIn1m < LIMIT_PER_MINUTE && countIn5m < LIMIT_PER_5MINUTES) {
      requestTimestamps.push(now);
      return;
    }
    const bindingWindowMs = countIn5m >= LIMIT_PER_5MINUTES ? WINDOW_5M_MS : WINDOW_1M_MS;
    const oldestBinding = countIn5m >= LIMIT_PER_5MINUTES ? requestTimestamps[0] : requestTimestamps.find((t) => now - t < WINDOW_1M_MS)!;
    await sleep(Math.max(bindingWindowMs - (now - oldestBinding) + 10, 10));
  }
}

async function doFetch(url: string): Promise<Response> {
  await waitForSlot();

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Encoding": "gzip" },
    });
    if (res.status !== 429) return res;

    const retryAfterHeader = Number(res.headers.get("Retry-After"));
    const backoffMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader * 1000
      : 2 ** attempt * 1000;
    await sleep(backoffMs);
  }
  throw new Error(`AODP rate limit exceeded after ${MAX_RETRIES} retries: ${url}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Splits item ids into chunks whose comma-joined length stays under the URL limit. */
function chunkItemIds(itemIds: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let currentLength = 0;
  for (const id of itemIds) {
    const addedLength = id.length + 1;
    if (current.length > 0 && currentLength + addedLength > MAX_URL_LENGTH) {
      chunks.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(id);
    currentLength += addedLength;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

export async function fetchPrices(server: AodpServer, itemIds: string[], qualities: number[] = [1]): Promise<AodpPriceRow[]> {
  const locations = ALL_LOCATIONS.join(",");
  const rows: AodpPriceRow[] = [];
  for (const chunk of chunkItemIds(itemIds)) {
    const url = `${aodpBaseUrl(server)}/api/v2/stats/prices/${chunk.join(",")}?locations=${encodeURIComponent(locations)}&qualities=${qualities.join(",")}`;
    const res = await throttledFetch(url);
    if (!res.ok) throw new Error(`AODP prices request failed (${res.status}): ${url}`);
    rows.push(...((await res.json()) as AodpPriceRow[]));
  }
  return rows;
}

export async function fetchHistory(
  server: AodpServer,
  itemIds: string[],
  dateFrom: Date,
  dateTo: Date,
  qualities: number[] = [1],
): Promise<AodpHistoryRow[]> {
  const locations = ALL_LOCATIONS.join(",");
  const date = formatAodpDate(dateFrom);
  const endDate = formatAodpDate(dateTo);
  const rows: AodpHistoryRow[] = [];
  for (const chunk of chunkItemIds(itemIds)) {
    const url =
      `${aodpBaseUrl(server)}/api/v2/stats/history/${chunk.join(",")}` +
      `?locations=${encodeURIComponent(locations)}&qualities=${qualities.join(",")}&time-scale=24&date=${date}&end_date=${endDate}`;
    const res = await throttledFetch(url);
    if (!res.ok) throw new Error(`AODP history request failed (${res.status}): ${url}`);
    rows.push(...((await res.json()) as AodpHistoryRow[]));
  }
  return rows;
}

// YYYY-MM-DD is the documented preferred format (MM-DD-YYYY is also accepted, but not preferred).
function formatAodpDate(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}
