import zlib from "node:zlib";
import { Readable } from "node:stream";
import tarStream from "tar-stream";
import type { AodpServer } from "./cities";
import type { Location } from "./cities";

// Only the last 4 daily backups are kept online -- fetch and process the latest one each time,
// never hoard a URL past today.
const DUMP_DIRS: Record<AodpServer, string> = {
  west: "https://albion-online-data.com/database/",
  east: "https://albion-online-data.com/database-east/",
  europe: "https://albion-online-data.com/database-europe/",
};

const DUMP_FILENAME_RE = /db_backup_\d{4}-\d{2}-\d{2}T\d{2}_\d{2}_\d{2}\.tgz/g;

/** Finds today's daily dump by parsing the directory's own index listing -- the filename's
 * timestamp sorts lexicographically, so the last match is the latest backup. */
export async function findLatestDumpUrl(server: AodpServer): Promise<string> {
  const dir = DUMP_DIRS[server];
  const res = await fetch(dir);
  if (!res.ok) throw new Error(`Failed to list AODP dump directory (${res.status}): ${dir}`);
  const html = await res.text();
  const names = [...html.matchAll(DUMP_FILENAME_RE)].map((m) => m[0]).sort();
  if (names.length === 0) throw new Error(`No daily dump (db_backup_*.tgz) found in ${dir}`);
  return dir + names[names.length - 1];
}

export type DumpVolumeSummary = {
  /** Sell-order fulfillment count, NOT total market activity -- same caveat as the REST history
   * endpoint this replaces. Copy says "volumen de ventas", never "del mercado". */
  avgDailyVolume30d: number;
  daysWithVolume30d: number;
  weightedAvgPrice30d: number | null;
};

type DayTotals = { amount: number; silver: number };
// Keyed by calendar day (YYYY-MM-DD). Both an hourly (aggregation=1) and a 6-hour
// (aggregation=6) series can cover the SAME day -- confirmed 2026-09-16: every day before
// 2026-09-09 has only aggregation=6 rows, every day since has BOTH, hourly and 6-hourly
// covering identical timestamps with identical totals. Summing both would silently double the
// volume for any day where they overlap, so each day keeps its two series separate and
// finalizeSummaries picks exactly one (preferring the finer hourly one) instead of adding them.
type DayBuckets = Map<string, { agg1?: DayTotals; agg6?: DayTotals }>;

const RETENTION_DAYS = 30;
// (id, item_amount, silver_amount, 'item_id', location, quality, 'timestamp', aggregation) --
// confirmed against a live dump's CREATE TABLE `market_history` statement, 2026-09-16.
const TUPLE_RE = /\((\d+),(\d+),(\d+),'([^']*)',(\d+),(\d+),'([^']*)',(-?\d+)\)/g;
// Item ids and timestamps are bounded (varchar(128), fixed-width datetime); this comfortably
// covers the longest possible tuple that could be split across a chunk boundary.
const TAIL_KEEP = 512;

/**
 * Streams AODP's daily MySQL dump (~260MB compressed, ~2GB decompressed, a single .sql file
 * inside the .tgz) and reduces its market_history table straight into the same 30-day volume
 * stats the REST /stats/history endpoint used to provide. Never holds the raw dump in memory or
 * on disk: only running per-(item,quality,city,day) accumulators, and stops downloading as soon
 * as the market_history table's data section ends (~90% of the file, so this saves little
 * bandwidth but avoids parsing tables this app doesn't use).
 */
export async function fetchDumpVolumeSummaries(
  dumpUrl: string,
  itemIds: ReadonlySet<string>,
  clusterIdToLocation: ReadonlyMap<string, Location>,
  now: Date,
): Promise<Map<string, DumpVolumeSummary>> {
  const cutoffMs = now.getTime() - RETENTION_DAYS * 24 * 3600 * 1000;
  const nowMs = now.getTime();
  const acc = new Map<string, DayBuckets>();

  const controller = new AbortController();
  const res = await fetch(dumpUrl, { signal: controller.signal });
  if (!res.ok || !res.body) throw new Error(`Failed to download AODP dump (${res.status}): ${dumpUrl}`);

  const extract = tarStream.extract();
  const gunzip = zlib.createGunzip();
  const source = Readable.fromWeb(res.body as never);

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      controller.abort();
      resolve();
    };
    const fail = (err: unknown) => {
      if (settled) return;
      settled = true;
      controller.abort();
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    extract.on("entry", (header, stream, next) => {
      if (!header.name.endsWith(".sql")) {
        stream.resume();
        stream.on("end", next);
        return;
      }

      let inTable = false;
      // Holds only genuinely unconsumed text (the seek marker or table end marker split across a
      // chunk boundary, or a tuple's trailing partial match) -- never re-includes already-matched
      // tuples, which a naive "keep the last N chars" tail would double-count on every chunk.
      let buffer = "";

      stream.on("data", (chunk) => {
        if (settled) return;
        buffer += (chunk as Buffer).toString("utf8");

        if (!inTable) {
          const startIdx = buffer.indexOf("INSERT INTO `market_history`");
          if (startIdx < 0) {
            if (buffer.length > TAIL_KEEP) buffer = buffer.slice(-TAIL_KEEP);
            return;
          }
          inTable = true;
          buffer = buffer.slice(startIdx);
        }

        const endIdx = buffer.indexOf("UNLOCK TABLES");
        const scanRegion = endIdx >= 0 ? buffer.slice(0, endIdx) : buffer;

        TUPLE_RE.lastIndex = 0;
        let m: RegExpExecArray | null;
        let consumedUpTo = 0;
        while ((m = TUPLE_RE.exec(scanRegion))) {
          consumedUpTo = TUPLE_RE.lastIndex;

          const itemAmount = Number(m[2]);
          const silverAmount = Number(m[3]);
          const itemId = m[4];
          if (!itemIds.has(itemId)) continue;

          const city = clusterIdToLocation.get(m[5]);
          if (!city) continue;

          const aggregation = m[8];
          if (aggregation !== "1" && aggregation !== "6") continue; // unknown series, don't guess

          const timestamp = m[7];
          const ts = Date.parse(`${timestamp.replace(" ", "T")}Z`);
          if (!Number.isFinite(ts) || ts < cutoffMs || ts > nowMs) continue;

          const quality = Number(m[6]);
          const key = `${itemId}|${quality}|${city}`;
          let dayBuckets = acc.get(key);
          if (!dayBuckets) {
            dayBuckets = new Map();
            acc.set(key, dayBuckets);
          }
          const day = timestamp.slice(0, 10);
          let dayEntry = dayBuckets.get(day);
          if (!dayEntry) {
            dayEntry = {};
            dayBuckets.set(day, dayEntry);
          }
          const seriesKey = aggregation === "1" ? "agg1" : "agg6";
          const series = dayEntry[seriesKey] ?? (dayEntry[seriesKey] = { amount: 0, silver: 0 });
          series.amount += itemAmount;
          series.silver += silverAmount;
        }

        if (endIdx >= 0) {
          stream.destroy();
          finish();
          return;
        }

        buffer = buffer.slice(consumedUpTo);
      });
      stream.on("end", next);
      stream.on("error", (err) => {
        if (!settled) fail(err);
      });
    });

    extract.on("finish", finish);
    extract.on("error", (err) => {
      if (!settled) fail(err);
    });
    gunzip.on("error", (err) => {
      if (!settled) fail(err);
    });
    source.on("error", (err) => {
      if (!settled) fail(err);
    });

    source.pipe(gunzip).pipe(extract);
  });

  const summaries = new Map<string, DumpVolumeSummary>();
  for (const [key, dayBuckets] of acc) {
    let totalVolume = 0;
    let weightedSum = 0;
    let weightTotal = 0;
    let daysWithVolume = 0;
    for (const dayEntry of dayBuckets.values()) {
      const chosen = dayEntry.agg1 ?? dayEntry.agg6!;
      totalVolume += chosen.amount;
      weightedSum += chosen.silver;
      weightTotal += chosen.amount;
      if (chosen.amount > 0) daysWithVolume++;
    }
    summaries.set(key, {
      avgDailyVolume30d: totalVolume / RETENTION_DAYS,
      daysWithVolume30d: daysWithVolume,
      weightedAvgPrice30d: weightTotal > 0 ? weightedSum / weightTotal : null,
    });
  }
  return summaries;
}
