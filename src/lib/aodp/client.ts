import { ALL_LOCATIONS, aodpBaseUrl, type AodpServer } from "./cities";
import type { AodpHistoryRow, AodpPriceRow } from "./types";

// AODP rate limits (verified against api-info.html, 2026-09-15): 180 req/min, 300 req/5min.
// We stay well under both with a single sequential queue plus a fixed minimum gap between
// requests, and back off exponentially on 429 instead of guessing a retry delay.
const MIN_GAP_MS = 400; // ~150 req/min ceiling, leaves headroom under the 180/min limit
const MAX_RETRIES = 5;
const MAX_URL_LENGTH = 4000; // AODP's documented limit is 4096; leave margin for the path+query

const CONTACT = process.env.AODP_CONTACT ?? "unknown";
const USER_AGENT = `PlataRank/0.1 (+https://github.com/InakiFarinas/platarank; contact: ${CONTACT})`;

let lastRequestAt = 0;
// All callers -- even ones invoked concurrently via Promise.all -- funnel through this single
// promise chain, so the MIN_GAP_MS spacing is real regardless of how many logical fetch "streams"
// are in flight. Without this, concurrent callers each read a stale `lastRequestAt` before any of
// them updates it and fire in a burst, which is exactly what triggers a 429 storm.
let queueTail: Promise<void> = Promise.resolve();

function throttledFetch(url: string): Promise<Response> {
  const result = queueTail.then(() => doFetch(url));
  queueTail = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function doFetch(url: string): Promise<Response> {
  const wait = MIN_GAP_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

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

function formatAodpDate(d: Date): string {
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${mm}-${dd}-${d.getUTCFullYear()}`;
}
