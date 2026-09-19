import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { alerts, marketAggregates, plans, recipes, userSettings, type Recipe } from "@/lib/db/schema";
import { computeCraft, type CraftParams } from "@/lib/craft-calc";
import type { CityPricePoint } from "@/lib/recipe-math";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platarank.vercel.app";
const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");

/** Re-prices every enabled alert's saved plan with the freshly ingested market data and posts to
 * the user's Discord webhook when profit crosses the threshold from below. Notifies on the
 * crossing only (not every hour while it stays above), so it never spams. */
export async function runAlerts(now: Date) {
  const rows = await db
    .select({ alert: alerts, plan: plans, webhook: userSettings.discordWebhookUrl })
    .from(alerts)
    .innerJoin(plans, eq(alerts.planId, plans.id))
    .leftJoin(userSettings, eq(userSettings.userId, alerts.userId))
    .where(eq(alerts.enabled, true));
  if (rows.length === 0) {
    console.log("No active alerts.");
    return;
  }

  const itemIds = [...new Set(rows.map((r) => r.plan.itemId))];
  const recipeRows = await db.select().from(recipes).where(inArray(recipes.itemId, itemIds));
  const recipeById = new Map<string, Recipe>(recipeRows.map((r) => [r.itemId, r]));

  const marketIds = new Set<string>();
  for (const r of recipeRows) {
    marketIds.add(r.itemId);
    for (const m of r.materials) marketIds.add(m.itemId);
  }
  const market: Record<string, CityPricePoint[]> = {};
  for (const a of await db.select().from(marketAggregates).where(inArray(marketAggregates.itemId, [...marketIds]))) {
    (market[a.itemId] ??= []).push({
      city: a.city,
      quality: a.quality,
      price: a.price != null ? Number(a.price) : null,
      priceAgeSeconds: a.priceAgeSeconds,
      avgDailyVolume30d: Number(a.avgDailyVolume30d),
      daysWithVolume30d: a.daysWithVolume30d,
      weightedAvgPrice30d: a.weightedAvgPrice30d != null ? Number(a.weightedAvgPrice30d) : null,
    });
  }

  let sent = 0;
  for (const { alert, plan, webhook } of rows) {
    const recipe = recipeById.get(plan.itemId);
    if (!recipe) {
      await db.update(alerts).set({ lastError: "La receta ya no existe.", lastCheckedAt: now }).where(eq(alerts.id, alert.id));
      continue;
    }
    if (!webhook) {
      await db.update(alerts).set({ lastError: "Configurá tu webhook de Discord para recibir avisos.", lastCheckedAt: now }).where(eq(alerts.id, alert.id));
      continue;
    }

    const result = computeCraft(recipe, market, plan.params as CraftParams);
    const threshold = Number(alert.threshold);
    const state = result.profit >= threshold ? "above" : "below";
    const crossed = state === "above" && alert.lastState !== "above";

    let error: string | null = null;
    let disable = false;
    if (crossed) {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "PlataRank",
          content:
            `**${plan.name}** superó tu umbral.\n` +
            `Ganancia: **${fmt(result.profit)}** (umbral ${fmt(threshold)}) · margen ${result.margin === null ? "--" : Math.round(result.margin * 100) + "%"}\n` +
            `Inversión ${fmt(result.cost)} → ingreso neto ${fmt(result.revenue)}\n` +
            `${SITE_URL}/es/calculadora?item=${encodeURIComponent(plan.itemId)}`,
        }),
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
