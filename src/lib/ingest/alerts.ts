import { localePath } from "@/i18n/config";
import { formatInt } from "@/lib/format";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { alerts, plans, userSettings, type Recipe } from "@/lib/db/schema";
import { computeCraft, marketPricedParams, type CraftParams } from "@/lib/craft-calc";
import { recipeById } from "@/lib/recipes-data";
import { loadMarketFor, recipeMarketItemIds } from "@/lib/server/station-data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platarank.vercel.app";

// Client-side only enforces this at input time; user_settings can be written directly via the
// Supabase REST API, so re-validate before ever fetching a saved webhook URL.
const WEBHOOK_PATTERN = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+$/;

/** Re-prices every enabled alert's saved plan with the freshly ingested market data and posts to
 * the user's Discord webhook when profit crosses the threshold from below. Notifies on the
 * crossing only (not every hour while it stays above), so it never spams. */
export async function runAlerts(now: Date) {
  const rows = await db
    .select({ alert: alerts, plan: plans, webhook: userSettings.discordWebhookUrl })
    .from(alerts)
    .innerJoin(plans, and(eq(alerts.planId, plans.id), eq(plans.userId, alerts.userId)))
    .leftJoin(userSettings, eq(userSettings.userId, alerts.userId))
    .where(eq(alerts.enabled, true));
  if (rows.length === 0) {
    console.log("No active alerts.");
    return;
  }

  const itemIds = [...new Set(rows.map((r) => r.plan.itemId))];
  // Recipes come from the bundled game data; prices for every plan's item, materials and
  // breeding/journal extras in one query.
  const recipes = itemIds.map(recipeById).filter((r): r is Recipe => r !== null);
  const market = await loadMarketFor(recipes.flatMap(recipeMarketItemIds));

  let sent = 0;
  for (const { alert, plan, webhook } of rows) {
    const recipe = recipeById(plan.itemId);
    if (!recipe) {
      await db.update(alerts).set({ lastError: "La receta ya no existe.", lastCheckedAt: now }).where(eq(alerts.id, alert.id));
      continue;
    }
    if (!webhook || !WEBHOOK_PATTERN.test(webhook)) {
      await db.update(alerts).set({ lastError: "Configurá tu webhook de Discord para recibir avisos.", lastCheckedAt: now }).where(eq(alerts.id, alert.id));
      continue;
    }

    // Market prices only: a hand-typed sell or material price would freeze the alert (see
    // marketPricedParams). The plans list shows the same figure as "hoy".
    const result = computeCraft(recipe, market, marketPricedParams(plan.params as CraftParams));
    const threshold = Number(alert.threshold);
    // A missing material price counts as 0 in computeCraft, which would read as a huge profit and
    // fire a false alert; without complete prices the plan just stays "below".
    const state = !result.incomplete && result.profit >= threshold ? "above" : "below";
    const crossed = state === "above" && alert.lastState !== "above";

    let error: string | null = null;
    let disable = false;
    if (crossed) {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "PlataRank",
          // plan.name is user text: never let it ping @everyone/@here or roles.
          allowed_mentions: { parse: [] },
          content:
            `**${plan.name}** superó tu umbral.\n` +
            `Ganancia: **${formatInt(result.profit)}** (umbral ${formatInt(threshold)}) · margen ${result.margin === null ? "--" : Math.round(result.margin * 100) + "%"}\n` +
            `Inversión ${formatInt(result.cost)} → ingreso neto ${formatInt(result.revenue)}\n` +
            `${SITE_URL}${localePath("es", "calculator", `?item=${encodeURIComponent(plan.itemId)}`)}`,
        }),
        redirect: "error",
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      if (res?.ok) sent++;
      else if (res && [401, 403, 404].includes(res.status)) {
        error = "El webhook de Discord ya no existe. Configuralo de nuevo.";
        disable = true;
      } else error = "No se pudo enviar el aviso a Discord; se reintenta en la próxima ingesta.";
    }

    await db
      .update(alerts)
      .set({
        // A failed send keeps the old state so the crossing is retried next hour.
        lastState: crossed && error ? alert.lastState : state,
        lastProfit: String(Math.round(result.profit)),
        lastCheckedAt: now,
        lastError: error,
        ...(disable ? { enabled: false } : {}),
      })
      .where(and(eq(alerts.id, alert.id)));
  }
  console.log(`Checked ${rows.length} alerts, sent ${sent} notifications.`);
}
