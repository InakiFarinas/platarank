"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
type Plan = { id: string; name: string; item_id: string; params: PlanParams; snapshot: PlanSnapshot; created_at: string };

const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");

export function PlansPanel({
  current,
  onOpen,
}: {
  current: { itemId: string; itemName: string; params: PlanParams; snapshot: PlanSnapshot } | null;
  onOpen: (itemId: string, params: PlanParams) => void;
}) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    setSignedIn(Boolean(userData.user));
    if (!userData.user) return;
    const { data, error: err } = await supabase.from("plans").select("*").order("created_at", { ascending: false });
    if (err) setError("No se pudieron cargar tus planificaciones.");
    else setPlans(data as Plan[]);
  }, []);

  useEffect(() => {
    void refresh();
    const { data } = createClient().auth.onAuthStateChange(() => void refresh());
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  async function save() {
    if (!current) return;
    setBusy(true);
    setError(null);
    const { error: err } = await createClient()
      .from("plans")
      .insert({ name: name.trim() || current.itemName, item_id: current.itemId, params: current.params, snapshot: current.snapshot });
    setBusy(false);
    if (err) return setError("No se pudo guardar.");
    setName("");
    void refresh();
  }

  async function remove(id: string) {
    const { error: err } = await createClient().from("plans").delete().eq("id", id);
    if (err) setError("No se pudo borrar.");
    else setPlans((p) => p.filter((x) => x.id !== id));
  }

  if (signedIn === null) return null;

  return (
    <section className="rounded-md border border-border bg-card/40 p-4">
      <h3 className="flex items-center gap-2 font-heading text-base">
        <Bookmark className="h-4 w-4 text-money" /> Planificaciones
      </h3>
      {!signedIn ? (
        <p className="mt-2 text-sm text-muted-foreground">Entrá con Discord para guardar tus cálculos y volver a verlos.</p>
      ) : (
        <>
          {current && (
            <div className="mt-3 flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Nombre (por defecto: ${current.itemName})`}
                className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={save}
                className="shrink-0 rounded-sm border border-money/50 bg-money/10 px-3 text-xs font-medium tracking-wide text-money hover:bg-money/20 disabled:opacity-50"
              >
                Guardar cálculo
              </button>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          {plans.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Todavía no guardaste ninguna.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {plans.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <button type="button" onClick={() => onOpen(p.item_id, p.params)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("es-AR")} · ×{p.params.qty}
                    </div>
                  </button>
                  <span className={cn("font-mono text-sm tabular-nums", p.snapshot.profit >= 0 ? "text-money" : "text-destructive")}>
                    {fmt(p.snapshot.profit)}
                  </span>
                  <button type="button" aria-label="Borrar" onClick={() => remove(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
