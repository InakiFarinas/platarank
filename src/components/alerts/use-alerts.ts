"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PlanAlert = {
  id: string;
  plan_id: string;
  threshold: number;
  enabled: boolean;
  last_state: string | null;
  last_profit: number | null;
  last_checked_at: string | null;
  last_error: string | null;
};

export const WEBHOOK_PATTERN = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+$/;

export function useAlerts(enabled: boolean) {
  const [alerts, setAlerts] = useState<PlanAlert[]>([]);
  const [webhook, setWebhook] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const [a, s] = await Promise.all([
      supabase.from("alerts").select("*"),
      supabase.from("user_settings").select("discord_webhook_url").maybeSingle(),
    ]);
    if (a.error || s.error) setError("No se pudieron cargar tus alertas.");
    else {
      setAlerts(a.data as PlanAlert[]);
      setWebhook((s.data?.discord_webhook_url as string | null | undefined) ?? null);
    }
  }, []);

  useEffect(() => {
    if (enabled) void reload();
    else {
      setAlerts([]);
      setWebhook(null);
    }
  }, [enabled, reload]);

  async function run(op: PromiseLike<{ error: unknown }>, failMessage: string) {
    setError(null);
    const { error: err } = await op;
    if (err) {
      setError(failMessage);
      return false;
    }
    await reload();
    return true;
  }

  return {
    alerts,
    webhook,
    error,
    saveWebhook: (url: string | null) =>
      run(createClient().from("user_settings").upsert({ discord_webhook_url: url, updated_at: new Date().toISOString() }), "No se pudo guardar el webhook."),
    // Re-arming resets last_state so an already-above plan notifies once when (re)enabled.
    saveAlert: (planId: string, threshold: number) =>
      run(
        createClient()
          .from("alerts")
          .upsert({ plan_id: planId, threshold, enabled: true, last_state: null, last_error: null }, { onConflict: "plan_id" }),
        "No se pudo guardar la alerta.",
      ),
    setEnabled: (id: string, on: boolean) =>
      run(createClient().from("alerts").update({ enabled: on, last_state: on ? null : undefined, last_error: null }).eq("id", id), "No se pudo cambiar la alerta."),
    removeAlert: (id: string) => run(createClient().from("alerts").delete().eq("id", id), "No se pudo borrar la alerta."),
  };
}

export type AlertsApi = ReturnType<typeof useAlerts>;
