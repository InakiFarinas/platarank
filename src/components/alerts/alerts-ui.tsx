"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { SilverInput } from "@/components/calculator/ui";
import { WEBHOOK_PATTERN, type AlertsApi, type PlanAlert } from "@/components/alerts/use-alerts";
import { cn } from "@/lib/utils";

const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");

/** Where alerts get delivered: a Discord webhook the user creates in their own channel. */
export function WebhookForm({ api }: { api: AlertsApi }) {
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
      setNote("Webhook guardado. Probalo para confirmar que llega.");
    }
  }

  async function test() {
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/alerts/test", { method: "POST" }).catch(() => null);
    setBusy(false);
    setNote(res?.ok ? "Enviamos un mensaje de prueba a tu canal." : "Discord no aceptó el mensaje. Revisá que el webhook siga existiendo.");
  }

  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-medium">Avisos por Discord</h4>
        {api.webhook && <span className="text-xs text-money">Webhook configurado</span>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        En tu servidor: Ajustes del canal → Integraciones → Webhooks → Nuevo webhook → Copiar URL. Pegala acá. Solo se usa para enviarte tus avisos.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={api.webhook ? "Pegá una URL nueva para reemplazarlo" : "https://discord.com/api/webhooks/…"}
          aria-label="URL del webhook de Discord"
          className="h-9 min-w-0 flex-1 basis-56 rounded-md border border-border bg-background px-2.5 text-sm outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30"
        />
        <button
          type="button"
          disabled={busy || !valid}
          onClick={save}
          className="h-9 rounded-sm border border-money bg-money px-3 text-xs font-medium tracking-wide text-money-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
        >
          Guardar
        </button>
        {api.webhook && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={test}
              className="h-9 rounded-sm border border-money/50 bg-money/10 px-3 text-xs font-medium tracking-wide text-money transition-colors duration-150 hover:bg-money/20 disabled:opacity-50"
            >
              Enviar prueba
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => api.saveWebhook(null)}
              className="h-9 px-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Quitar
            </button>
          </>
        )}
      </div>
      {url.trim() !== "" && !valid && (
        <p className="mt-1.5 text-xs text-destructive">Tiene que ser una URL de webhook de Discord (https://discord.com/api/webhooks/…).</p>
      )}
      <p role="status" className="mt-1.5 min-h-4 text-xs text-muted-foreground">
        {api.error ?? note ?? ""}
      </p>
    </div>
  );
}

/** Bell toggle + threshold editor for one saved plan. */
export function AlertControl({ planId, currentProfit, api }: { planId: string; currentProfit: number; api: AlertsApi }) {
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
        {active ? `Aviso al superar ${fmt(alert!.threshold)}` : "Avisarme por Discord"}
      </button>

      {open && (
        <div className="mt-2 rounded-md border border-border bg-background/40 p-3">
          {!api.webhook && <p className="mb-2 text-xs text-destructive">Primero configurá tu webhook de Discord arriba.</p>}
          <div className="flex flex-wrap items-end gap-2">
            <label className="block w-40">
              <span className="text-xs text-muted-foreground">Avisar cuando la ganancia llegue a</span>
              <div className="mt-1">
                <SilverInput label="Umbral de ganancia" value={threshold} onChange={setThreshold} />
              </div>
            </label>
            <button
              type="button"
              disabled={threshold <= 0}
              onClick={() => api.saveAlert(planId, threshold)}
              className="h-9 rounded-sm border border-money bg-money px-3 text-xs font-medium tracking-wide text-money-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
            >
              {alert ? "Actualizar" : "Activar aviso"}
            </button>
            {alert && (
              <>
                <button
                  type="button"
                  onClick={() => api.setEnabled(alert.id, !alert.enabled)}
                  className="h-9 px-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  {alert.enabled ? "Pausar" : "Reactivar"}
                </button>
                <button
                  type="button"
                  onClick={() => api.removeAlert(alert.id)}
                  className="h-9 px-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
                >
                  Borrar
                </button>
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Se revisa cada hora con los precios nuevos y te avisa una sola vez cuando cruza el umbral (no repite mientras siga arriba).
          </p>
          {alert && (
            <p className="mt-1 text-xs text-muted-foreground">
              {alert.last_checked_at
                ? `Última revisión: ${new Date(alert.last_checked_at).toLocaleString("es-AR")}${alert.last_profit !== null ? ` · ganancia ${fmt(alert.last_profit)}` : ""}`
                : "Todavía no se revisó; pasa en la próxima actualización de precios."}
              {!alert.enabled && " · en pausa"}
            </p>
          )}
          {alert?.last_error && <p className="mt-1 text-xs text-destructive">{alert.last_error}</p>}
        </div>
      )}
    </div>
  );
}
