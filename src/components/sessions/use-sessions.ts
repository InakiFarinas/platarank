"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PlanDraft, PlanParams, PlanSnapshot } from "@/components/calculator/plans-panel";

export type SessionItem = {
  id: string;
  session_id: string;
  item_id: string;
  item_name: string;
  params: PlanParams;
  snapshot: PlanSnapshot;
  actual_cost: number | null;
  actual_revenue: number | null;
  created_at: string;
};
export type CraftingSession = { id: string; name: string; created_at: string; session_items: SessionItem[] };

/** What an item counts for in its session: the real figure once the player typed it, else the
 * calculator's estimate from the moment it was added. */
export function itemTotals(i: SessionItem) {
  const cost = i.actual_cost ?? i.snapshot.cost;
  const revenue = i.actual_revenue ?? i.snapshot.revenue;
  return { cost, revenue, profit: revenue - cost, isReal: i.actual_cost !== null || i.actual_revenue !== null };
}

export function sessionTotals(s: CraftingSession) {
  return s.session_items.reduce(
    (acc, i) => {
      const t = itemTotals(i);
      return { cost: acc.cost + t.cost, revenue: acc.revenue + t.revenue, profit: acc.profit + t.profit };
    },
    { cost: 0, revenue: 0, profit: 0 },
  );
}

export function useSessions() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<CraftingSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    setSignedIn(Boolean(userData.user));
    if (!userData.user) {
      setSessions([]);
      return;
    }
    const { data, error: err } = await supabase
      .from("crafting_sessions")
      .select("*, session_items(*)")
      .order("created_at", { ascending: false });
    if (err) {
      setError("No se pudieron cargar tus sesiones.");
      return;
    }
    const list = (data as CraftingSession[]).map((s) => ({
      ...s,
      session_items: [...s.session_items].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    }));
    setSessions(list);
  }, []);

  useEffect(() => {
    void reload();
    const { data } = createClient().auth.onAuthStateChange(() => void reload());
    return () => data.subscription.unsubscribe();
  }, [reload]);

  async function run(op: PromiseLike<{ error: unknown }>, failMessage: string): Promise<boolean> {
    setError(null);
    const { error: err } = await op;
    if (err) {
      setError(failMessage);
      return false;
    }
    await reload();
    return true;
  }

  const supabase = () => createClient();

  return {
    signedIn,
    sessions,
    error,
    async createSession(name: string): Promise<string | null> {
      setError(null);
      const { data, error: err } = await supabase().from("crafting_sessions").insert({ name: name.trim() || "Sesión sin nombre" }).select("id").single();
      if (err || !data) {
        setError("No se pudo crear la sesión.");
        return null;
      }
      await reload();
      return data.id as string;
    },
    addItem: (sessionId: string, draft: PlanDraft) =>
      run(
        supabase().from("session_items").insert({
          session_id: sessionId,
          item_id: draft.itemId,
          item_name: draft.itemName,
          params: draft.params,
          snapshot: draft.snapshot,
        }),
        "No se pudo agregar el ítem.",
      ),
    setActuals: (itemId: string, actual_cost: number | null, actual_revenue: number | null) =>
      run(supabase().from("session_items").update({ actual_cost, actual_revenue }).eq("id", itemId), "No se pudo guardar el resultado real."),
    removeItem: (itemId: string) => run(supabase().from("session_items").delete().eq("id", itemId), "No se pudo quitar el ítem."),
    renameSession: (id: string, name: string) =>
      run(supabase().from("crafting_sessions").update({ name: name.trim() || "Sesión sin nombre" }).eq("id", id), "No se pudo renombrar."),
    deleteSession: (id: string) => run(supabase().from("crafting_sessions").delete().eq("id", id), "No se pudo borrar la sesión."),
  };
}

export type SessionsApi = ReturnType<typeof useSessions>;
