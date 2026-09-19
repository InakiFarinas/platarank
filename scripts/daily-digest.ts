// Daily digest: posts the top recipes by realizable silver/day to a Discord channel webhook.
// Runs from .github/workflows/daily-digest.yml. DRY_RUN=1 prints the message instead of sending.
import "dotenv/config";
import { getTopRecipes } from "../src/lib/server/top-recipes";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platarank.vercel.app";
const TOP = 5;
const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");

async function main() {
  const webhook = process.env.DISCORD_DAILY_WEBHOOK;
  const dryRun = process.env.DRY_RUN === "1";
  if (!webhook && !dryRun) {
    console.log("DISCORD_DAILY_WEBHOOK is not set; nothing to do.");
    process.exit(0);
  }

  const top = await getTopRecipes(TOP);
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
    allowed_mentions: { parse: [] },
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
