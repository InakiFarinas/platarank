"use client";

import { formatInt } from "@/lib/format";
import { useState } from "react";
import { Bell } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CTA_PRIMARY, CTA_SECONDARY, SilverInput } from "@/components/calculator/ui";
import { WEBHOOK_PATTERN, type AlertsApi, type PlanAlert } from "@/components/alerts/use-alerts";
import { cn } from "@/lib/utils";


/** Where alerts get delivered: a Discord webhook the user creates in their own channel. */
export function WebhookForm({ api }: { api: AlertsApi }) {
  const t = useTranslations("sessions.alerts");
  const locale = useLocale();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const valid = WEBHOOK_PATTERN.test(url.trim());

  async function save() {
    setBusy(true);
    setNote(null);
    const ok = await api.saveWebhook(url.trim());
    setBusy(false);
    if (ok) {
      setUrl("");
      setNote(t("webhookSaved"));
    }
  }

  async function test() {
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/alerts/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale }) }).catch(() => null);
    setBusy(false);
    setNote(res?.ok ? t("testSent") : t("testFailed"));
  }

  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-medium">{t("title")}</h4>
        {api.webhook && <span className="text-xs text-muted-foreground">{t("webhookConfigured")}</span>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("webhookHelp")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={api.webhook ? t("urlPlaceholderReplace") : "https://discord.com/api/webhooks/…"}
          aria-label={t("urlLabel")}
          className="h-9 min-w-0 flex-1 basis-56 rounded-md border border-border bg-background px-2.5 text-sm outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30"
        />
        <button
          type="button"
          disabled={busy || !valid}
          onClick={save}
          className={cn(CTA_PRIMARY, "h-9 px-3 text-xs")}
        >
          {t("save")}
        </button>
        {api.webhook && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={test}
              className={cn(CTA_SECONDARY, "h-9 px-3 text-xs")}
            >
              {t("sendTest")}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => api.saveWebhook(null)}
              className="h-9 px-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t("remove")}
            </button>
          </>
        )}
      </div>
      {url.trim() !== "" && !valid && (
        <p className="mt-1.5 text-xs text-destructive">{t("urlInvalid")}</p>
      )}
      <p role="status" className="mt-1.5 min-h-4 text-xs text-muted-foreground">
        {api.error ?? note ?? ""}
      </p>
    </div>
  );
}

/** Bell toggle + threshold editor for one saved plan. */
export function AlertControl({ planId, currentProfit, api }: { planId: string; currentProfit: number; api: AlertsApi }) {
  const t = useTranslations("sessions.alerts");
  const locale = useLocale();
  const alert: PlanAlert | undefined = api.alerts.find((a) => a.plan_id === planId);
  const [open, setOpen] = useState(false);
  const [threshold, setThreshold] = useState(alert ? alert.threshold : Math.max(0, Math.round(currentProfit * 1.5)));
  const active = alert?.enabled === true;

  return (
    <div className="w-full">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs transition-colors",
          active ? "text-money" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Bell className="h-3.5 w-3.5" />
        {active ? t("activeLabel", { threshold: formatInt(alert!.threshold) }) : t("notifyMe")}
      </button>

      {open && (
        <div className="mt-2 rounded-md border border-border bg-background/40 p-3">
          {!api.webhook && <p className="mb-2 text-xs text-destructive">{t("needWebhook")}</p>}
          <div className="flex flex-wrap items-end gap-2">
            <label className="block w-40">
              <span className="text-xs text-muted-foreground">{t("notifyWhen")}</span>
              <div className="mt-1">
                <SilverInput label={t("thresholdLabel")} value={threshold} onChange={setThreshold} />
              </div>
            </label>
            <button
              type="button"
              disabled={threshold <= 0}
              onClick={() => api.saveAlert(planId, threshold)}
              className={cn(CTA_PRIMARY, "h-9 px-3 text-xs")}
            >
              {alert ? t("update") : t("activate")}
            </button>
            {alert && (
              <>
                <button
                  type="button"
                  onClick={() => api.setEnabled(alert.id, !alert.enabled)}
                  className="h-9 px-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  {alert.enabled ? t("pause") : t("resume")}
                </button>
                <button
                  type="button"
                  onClick={() => api.removeAlert(alert.id)}
                  className="h-9 px-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
                >
                  {t("delete")}
                </button>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("howItWorks")}
          </p>
          {alert && (
            <p className="mt-1 text-xs text-muted-foreground">
              {alert.last_checked_at
                ? t("lastChecked", { date: new Date(alert.last_checked_at).toLocaleString(locale === "en" ? "en-US" : "es-AR") }) + (alert.last_profit !== null ? t("lastProfit", { profit: formatInt(alert.last_profit) }) : "")
                : t("neverChecked")}
              {!alert.enabled && t("paused")}
            </p>
          )}
          {alert?.last_error && <p className="mt-1 text-xs text-destructive">{alert.last_error}</p>}
        </div>
      )}
    </div>
  );
}
