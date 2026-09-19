"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { itemIconUrl } from "@/lib/item-icons";
import { cn } from "@/lib/utils";

export type PlanParams = {
  qty: number;
  premium: boolean;
  blackMarket: boolean;
  quality: number;
  craftCity: string;
  focus: boolean;
  feeRate: number;
  extraCost: number;
  sellOverride: number | null;
  matOverrides: Record<string, number>;
};
export type PlanSnapshot = { cost: number; revenue: number; profit: number; sellPrice: number };
export type Plan = { id: string; name: string; item_id: string; params: PlanParams; snapshot: PlanSnapshot; created_at: string };
export type PlanDraft = { itemId: string; itemName: string; params: PlanParams; snapshot: PlanSnapshot };

const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");

export function usePlans() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    setSignedIn(Boolean(userData.user));
    if (!userData.user) {
      setPlans([]);
      return;
    }
    const { data, error: err } = await supabase.from("plans").select("*").order("created_at", { ascending: false });
    if (err) setError("No se pudieron cargar tus planificaciones.");
    else setPlans(data as Plan[]);
  }, []);

  useEffect(() => {
    void refresh();
    const { data } = createClient().auth.onAuthStateChange(() => void refresh());
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  async function save(name: string, draft: PlanDraft): Promise<boolean> {
    setError(null);
    const { error: err } = await createClient()
      .from("plans")
      .insert({ name: name.trim() || draft.itemName, item_id: draft.itemId, params: draft.params, snapshot: draft.snapshot });
    if (err) {
      setError("No se pudo guardar.");
      return false;
    }
    await refresh();
    return true;
  }

  async function remove(id: string) {
    const { error: err } = await createClient().from("plans").delete().eq("id", id);
    if (err) setError("No se pudo borrar.");
    else setPlans((p) => p.filter((x) => x.id !== id));
  }

  return { signedIn, plans, error, save, remove };
}

export type PlansApi = ReturnType<typeof usePlans>;

export function SavePlanForm({ api, draft }: { api: PlansApi; draft: PlanDraft }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (api.signedIn === null) return null;
  if (!api.signedIn) {
    return <p className="text-xs text-muted-foreground">Entrá con Discord para guardar este cálculo.</p>;
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder={draft.itemName}
          aria-label="Nombre de la planificación"
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 text-sm outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30"
        />
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const ok = await api.save(name, draft);
            setBusy(false);
            if (ok) {
              setName("");
              setSaved(true);
            }
          }}
          className="h-9 shrink-0 rounded-sm border border-money bg-money px-3 text-xs font-medium tracking-wide text-money-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </div>
      <p role="status" className="mt-1.5 min-h-4 text-xs text-muted-foreground">
        {api.error ?? (saved ? "Guardada en Planificaciones." : "")}
      </p>
    </div>
  );
}

export function PlanList({ api, onOpen }: { api: PlansApi; onOpen: (itemId: string, params: PlanParams) => void }) {
  if (api.signedIn === null) return null;
  if (!api.signedIn) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Entrá con Discord para guardar tus cálculos y volver a verlos cuando quieras.
      </p>
    );
  }
  if (api.plans.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Todavía no guardaste ninguna. Armá un cálculo y usá &quot;Guardar&quot; en el balance.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {api.plans.map((p) => (
        <li key={p.id} className="flex items-center gap-3 py-2.5">
          <button type="button" onClick={() => onOpen(p.item_id, p.params)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={itemIconUrl(p.item_id, p.params.quality, 64)} alt="" className="h-10 w-10 shrink-0" />
            <span className="min-w-0">
              <span className="block truncate text-sm">{p.name}</span>
              <span className="block text-[11px] text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString("es-AR")} · ×{p.params.qty} · {p.params.craftCity}
              </span>
            </span>
          </button>
          <span className={cn("font-mono text-sm tabular-nums", p.snapshot.profit >= 0 ? "text-money" : "text-destructive")}>
            {p.snapshot.profit >= 0 ? "+" : ""}
            {fmt(p.snapshot.profit)}
          </span>
          <button
            type="button"
            aria-label={`Borrar ${p.name}`}
            onClick={() => api.remove(p.id)}
            className="relative p-1.5 text-muted-foreground transition-colors hover:text-destructive after:absolute after:-inset-1.5 after:content-['']"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
