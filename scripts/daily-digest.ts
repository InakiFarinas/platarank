// Daily digest: posts the top recipes by realizable silver/day to a Discord channel webhook.
// Runs from .github/workflows/daily-digest.yml. DRY_RUN=1 prints the message instead of sending.
import "dotenv/config";
import { DEFAULT_PARAMS } from "../src/lib/recipe-math";
import { loadStationData, rankStation, type StationType } from "../src/lib/server/station-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platarank.vercel.app";
const STATIONS: { type: StationType; label: string; path: string }[] = [
  { type: "alchemy", label: "Alquimia", path: "alquimia" },
  { type: "refining", label: "Refinado", path: "refinado" },
  { type: "cooking", label: "Cocina", path: "cocina" },
  { type: "gear", label: "Equipo", path: "equipo" },
  { type: "mount", label: "Monturas", path: "monturas" },
];
const TOP = 5;
// A public post must not headline artifacts: real crafting margins above ~150% are almost always a
// bad quote, and a volume figure driven by a couple of days of trades (one spike) is not a daily rate.
const MAX_MARGIN = 1.5;
const MIN_DAYS_OF_TOP_VOLUME = 15;
const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");

async function main() {
  const webhook = process.env.DISCORD_DAILY_WEBHOOK;
  const dryRun = process.env.DRY_RUN === "1";
  if (!webhook && !dryRun) {
    console.log("DISCORD_DAILY_WEBHOOK is not set; nothing to do.");
    process.exit(0);
  }

  // Fresh, actually-traded rows only: a stale or near-zero-volume listing can top the ranking with
  // a number nobody could realize.
  const filters = { nameQuery: "", maxAgeHours: 24, minVolume: 10 };
  const all: { label: string; row: ReturnType<typeof rankStation>["rows"][number] }[] = [];
  for (const s of STATIONS) {
    const data = await loadStationData(s.type);
    // Rank deep (not just TOP) since the sanity checks below discard rows after ranking.
    for (const row of rankStation(data, DEFAULT_PARAMS, filters, 60).rows) {
      if (row.marginPct === null || row.marginPct > MAX_MARGIN) continue;
      const points = data.marketByItem[row.recipe.itemId] ?? [];
      const biggest = points.reduce((a, b) => (b.avgDailyVolume30d > (a?.avgDailyVolume30d ?? -1) ? b : a), points[0]);
      if (!biggest || biggest.daysWithVolume30d < MIN_DAYS_OF_TOP_VOLUME) continue;
      all.push({ label: s.label, row });
    }
  }
  all.sort((a, b) => (b.row.platinumPerDay ?? 0) - (a.row.platinumPerDay ?? 0));
  const top = all.filter((x) => (x.row.platinumPerDay ?? 0) > 0).slice(0, TOP);
  if (top.length === 0) {
    console.log("No rows to report.");
    process.exit(0);
  }

  const lines = top.map(({ label, row }, i) => {
    const r = row.recipe;
    const enchant = r.enchant > 0 ? `.${r.enchant}` : "";
    const margin = row.marginPct === null ? "--" : `${Math.round(row.marginPct * 100)}%`;
    return `**${i + 1}. [${r.nameEs} T${r.tier}${enchant}](${SITE_URL}/es/calculadora?item=${encodeURIComponent(r.itemId)})** · ${label}\n${fmt(row.platinumPerDay ?? 0)} plata/día · ganancia ${fmt(row.profitPerUnit ?? 0)} c/u · margen ${margin}`;
  });

  const payload = {
    username: "PlataRank",
    embeds: [
      {
        title: "Las mejores recetas de hoy",
        description: lines.join("\n\n"),
        color: 0xeba23a,
        url: `${SITE_URL}/es`,
        footer: { text: "Plata realizable por día = ganancia × volumen × 10% de cuota. Datos del servidor Américas." },
      },
    ],
  };

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  }
  const res = await fetch(webhook!, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(`Discord responded ${res.status}`);
  console.log(`Posted top ${top.length} recipes.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
