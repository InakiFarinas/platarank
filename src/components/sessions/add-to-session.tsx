"use client";

import { useState } from "react";
import Link from "next/link";
import type { PlanDraft } from "@/components/calculator/plans-panel";
import { CTA_SECONDARY } from "@/components/calculator/ui";
import { useSessions } from "@/components/sessions/use-sessions";
import { cn } from "@/lib/utils";

const NEW = "__new__";

/** Adds the calculator's current result to a crafting session (an existing one or a new one). */
export function AddToSession({ draft }: { draft: PlanDraft }) {
  const api = useSessions();
  const [target, setTarget] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (api.signedIn === null) return null;
  if (!api.signedIn) {
    return <p className="text-xs text-muted-foreground">Entrá con Discord para armar sesiones de crafteo.</p>;
  }

  const chosen = target || api.sessions[0]?.id || NEW;
  const creating = chosen === NEW;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Agregar a sesión</span>
        <Link href="/es/sesiones" className="text-xs text-money underline underline-offset-2">
          Ver sesiones
        </Link>
      </div>
      <div className="flex gap-2">
        <select
          value={chosen}
          onChange={(e) => {
            setTarget(e.target.value);
            setDone(null);
          }}
          aria-label="Sesión de destino"
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
        >
          {api.sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value={NEW}>+ Nueva sesión</option>
        </select>
        <button
          type="button"
          disabled={busy || (creating && newName.trim() === "")}
          onClick={async () => {
            setBusy(true);
            const sessionId = creating ? await api.createSession(newName) : chosen;
            const ok = sessionId ? await api.addItem(sessionId, draft) : false;
            setBusy(false);
            if (ok && sessionId) {
              setTarget(sessionId);
              setNewName("");
              setDone(`${draft.itemName} agregado.`);
            }
          }}
          className={cn(CTA_SECONDARY, "h-9 shrink-0 px-3 text-xs")}
        >
          {busy ? "Agregando…" : "Agregar"}
        </button>
      </div>
      {creating && (
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre de la sesión (ej. Tarde de pociones)"
          aria-label="Nombre de la nueva sesión"
          className="mt-2 h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30"
        />
      )}
      <p role="status" className="mt-1.5 min-h-4 text-xs text-muted-foreground">
        {api.error ?? done ?? ""}
      </p>
    </div>
  );
}
