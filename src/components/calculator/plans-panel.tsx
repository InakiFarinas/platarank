"use client";

import { formatInt } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { useCallback, useEffect, useState } from "react";
import { computeCraft, hasPriceOverrides, marketPricedParams, type CraftParams } from "@/lib/craft-calc";
import type { CityPricePoint } from "@/lib/recipe-math";
import type { Recipe } from "@/lib/db/schema";
import { AlertControl } from "@/components/alerts/alerts-ui";
import type { AlertsApi } from "@/components/alerts/use-alerts";
import { createClient } from "@/lib/supabase/client";
import { itemIconUrl } from "@/lib/item-icons";
import { CTA_PRIMARY, CTA_SECONDARY, ConfirmDelete, DisclosureButton } from "@/components/calculator/ui";
import { cn } from "@/lib/utils";

export type PlanParams = CraftParams;
export type PlanSnapshot = { cost: number; revenue: number; profit: number; sellPrice: number };
export type Plan = {
  id: string;
  name: string;
  item_id: string;
  params: PlanParams;
  snapshot: PlanSnapshot;
  /** What the player really spent / sold for once the craft is done. Null = not entered. */
  actual_cost: number | null;
  actual_revenue: number | null;
  created_at: string;
  updated_at: string;
};
export type PlanDraft = { itemId: string; itemName: string; params: PlanParams; snapshot: PlanSnapshot };
/** The saved plan currently loaded in the calculator -- what "Actualizar" writes back to. */
export type OpenedPlan = { id: string; name: string; itemId: string };

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export function usePlans() {
  const t = useTranslations("calculator.plans");
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
    const { data, error: err } = await supabase.from("plans").select("*").order("updated_at", { ascending: false });
    if (err) setError(t("loadFailed"));
    else
      // numeric columns can arrive as strings from PostgREST; the UI does arithmetic on them.
      setPlans((data as Plan[]).map((p) => ({ ...p, actual_cost: num(p.actual_cost), actual_revenue: num(p.actual_revenue) })));
  }, [t]);

  useEffect(() => {
    void refresh();
    const { data } = createClient().auth.onAuthStateChange(() => void refresh());
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  async function run(op: PromiseLike<{ error: unknown }>, failMessage: string): Promise<boolean> {
    setError(null);
    const { error: err } = await op;
    if (err) {
      setError(failMessage);
      return false;
    }
    await refresh();
    return true;
  }

  return {
    signedIn,
    plans,
    error,
    save: (name: string, draft: PlanDraft) =>
      run(
        createClient()
          .from("plans")
          .insert({ name: name.trim() || draft.itemName, item_id: draft.itemId, params: draft.params, snapshot: draft.snapshot }),
        t("saveFailed"),
      ),
    /** Rewrites an existing plan in place: same id, so its alert follows the new assumptions. */
    update: (id: string, draft: PlanDraft) =>
      run(
        createClient()
          .from("plans")
          .update({ item_id: draft.itemId, params: draft.params, snapshot: draft.snapshot, updated_at: new Date().toISOString() })
          .eq("id", id),
        t("saveFailed"),
      ),
    /** Both figures in one write, so saving one can never overwrite the other with a stale value. */
    setActuals: (id: string, actualCost: number | null, actualRevenue: number | null) =>
      run(createClient().from("plans").update({ actual_cost: actualCost, actual_revenue: actualRevenue }).eq("id", id), t("actualsFailed")),
    remove: (id: string) => run(createClient().from("plans").delete().eq("id", id), t("deleteFailed")),
  };
}

export type PlansApi = ReturnType<typeof usePlans>;

type LiveResult = { profit: number; incomplete: boolean };

/** Each plan re-priced with today's market (hand-typed prices dropped, same as its Discord alert):
 * one /api/calculator/item request per distinct item -- the same CDN-cached route the calculator
 * itself reads -- and the math runs here with the shared computeCraft. */
function useLiveProfits(plans: Plan[]): Record<string, LiveResult | undefined> {
  const [byItem, setByItem] = useState<Record<string, { recipe: Recipe; market: Record<string, CityPricePoint[]> } | null>>({});
  const itemKey = [...new Set(plans.map((p) => p.item_id))].sort().join(",");

  useEffect(() => {
    if (!itemKey) return;
    let live = true;
    const ids = itemKey.split(",");
    void Promise.all(
      ids.map((id) =>
        fetch(`/api/calculator/item?id=${encodeURIComponent(id)}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((results) => {
      if (live) setByItem(Object.fromEntries(ids.map((id, i) => [id, results[i]])));
    });
    return () => {
      live = false;
    };
  }, [itemKey]);

  const out: Record<string, LiveResult | undefined> = {};
  for (const p of plans) {
    const data = byItem[p.item_id];
    if (!data) continue;
    const r = computeCraft(data.recipe, data.market, marketPricedParams(p.params));
    out[p.id] = { profit: r.profit, incomplete: r.incomplete };
  }
  return out;
}

export function SavePlanForm({ api, draft, openedPlan }: { api: PlansApi; draft: PlanDraft; openedPlan: OpenedPlan | null }) {
  const t = useTranslations("calculator.plans");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (api.signedIn === null) return null;
  if (!api.signedIn) {
    return <p className="text-xs text-muted-foreground">{t("signInToSave")}</p>;
  }

  // Only offer to overwrite the opened plan while the calculator still shows its item.
  const updatable = openedPlan !== null && openedPlan.itemId === draft.itemId && api.plans.some((p) => p.id === openedPlan.id);

  async function act(op: () => Promise<boolean>, doneNote: string) {
    setBusy(true);
    setNote(null);
    const ok = await op();
    setBusy(false);
    if (ok) {
      setName("");
      setNote(doneNote);
    }
  }

  return (
    <div>
      {updatable && (
        <div className="mb-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => act(() => api.update(openedPlan.id, draft), t("updated", { name: openedPlan.name }))}
            className={cn(CTA_PRIMARY, "h-9 w-full px-3 text-xs")}
          >
            {t("update", { name: openedPlan.name })}
          </button>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("updateHint")}</p>
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNote(null);
          }}
          placeholder={draft.itemName}
          aria-label={t("nameLabel")}
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 text-sm outline-none transition-colors duration-150 placeholder:text-muted-foreground focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => act(() => api.save(name, draft), t("saved"))}
          className={cn(CTA_SECONDARY, "h-9 shrink-0 px-3 text-xs")}
        >
          {busy ? t("saving") : updatable ? t("saveAsNew") : t("save")}
        </button>
      </div>
      <p role="status" className="mt-1.5 min-h-4 text-xs text-muted-foreground">
        {api.error ?? note ?? ""}
      </p>
    </div>
  );
}

const signed = (n: number, locale: Locale) => `${n >= 0 ? "+" : "−"}${formatInt(Math.abs(n), locale)}`;

export function PlanList({ api, alertsApi, onOpen }: { api: PlansApi; alertsApi: AlertsApi; onOpen: (plan: Plan) => void }) {
  const t = useTranslations("calculator.plans");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const live = useLiveProfits(api.plans);

  if (api.signedIn === null) return null;
  if (!api.signedIn) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{t("signInToView")}</p>;
  }
  if (api.plans.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">{t("empty")}</p>;
  }
  return (
    <>
      {api.error && <p className="mb-2 text-xs text-destructive">{api.error}</p>}
      <ul className="divide-y divide-border">
        {api.plans.map((p) => (
          <PlanRow
            key={p.id}
            plan={p}
            live={live[p.id]}
            api={api}
            alertsApi={alertsApi}
            onOpen={onOpen}
            confirming={confirmId === p.id}
            setConfirming={(on) => setConfirmId(on ? p.id : null)}
          />
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">{t("todayNote")}</p>
    </>
  );
}

function PlanRow({
  plan: p,
  live,
  api,
  alertsApi,
  onOpen,
  confirming,
  setConfirming,
}: {
  plan: Plan;
  live: LiveResult | undefined;
  api: PlansApi;
  alertsApi: AlertsApi;
  onOpen: (plan: Plan) => void;
  confirming: boolean;
  setConfirming: (on: boolean) => void;
}) {
  const t = useTranslations("calculator.plans");
  const locale = useLocale() as Locale;
  const [resultOpen, setResultOpen] = useState(false);
  const realProfit = p.actual_cost !== null && p.actual_revenue !== null ? p.actual_revenue - p.actual_cost : null;
  const date = new Date(p.updated_at ?? p.created_at).toLocaleDateString(locale === "en" ? "en-US" : "es-AR");

  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onOpen(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={itemIconUrl(p.item_id, p.params.quality, 64)} alt="" width={40} height={40} className="h-10 w-10 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-sm">{p.name}</span>
            <span className="block text-xs text-muted-foreground">
              ×{p.params.qty} · {p.params.craftCity} · {t("savedOn", { date })}
            </span>
          </span>
        </button>
        <div className="shrink-0 text-right">
          <div
            className={cn(
              "font-mono text-sm tabular-nums",
              !live || live.incomplete ? "text-muted-foreground" : live.profit >= 0 ? "text-money" : "text-destructive",
            )}
          >
            {live ? signed(live.profit, locale) : "…"}
            <span className="ml-1 font-sans text-xs text-muted-foreground">{live?.incomplete ? t("todayIncomplete") : t("today")}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {t("whenSaved")} <span className="font-mono tabular-nums">{signed(p.snapshot.profit, locale)}</span>
          </div>
        </div>
        <ConfirmDelete
          confirming={confirming}
          onRequestConfirm={() => setConfirming(true)}
          onConfirm={() => {
            setConfirming(false);
            void api.remove(p.id);
          }}
          onCancel={() => setConfirming(false)}
          label={t("deleteLabel", { name: p.name })}
        />
      </div>
      <div className="mt-1.5 space-y-1.5 pl-[3.25rem]">
        <DisclosureButton
          open={resultOpen}
          onToggle={() => setResultOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {realProfit !== null ? (
            <>
              {t("realResult")}{" "}
              <span className={cn("font-mono tabular-nums", realProfit >= 0 ? "text-money" : "text-destructive")}>{signed(realProfit, locale)}</span>
            </>
          ) : p.actual_cost !== null || p.actual_revenue !== null ? (
            t("realResultPartial")
          ) : (
            t("addRealResult")
          )}
        </DisclosureButton>
        {resultOpen && <ActualsForm plan={p} api={api} onDone={() => setResultOpen(false)} />}
        <AlertControl
          planId={p.id}
          currentProfit={live && !live.incomplete ? live.profit : p.snapshot.profit}
          hasOverrides={hasPriceOverrides(p.params)}
          api={alertsApi}
        />
      </div>
    </li>
  );
}

/** Real spend and real sale for a done craft, saved together with one explicit button -- an empty
 * field means "not entered", never zero. */
function ActualsForm({ plan, api, onDone }: { plan: Plan; api: PlansApi; onDone: () => void }) {
  const t = useTranslations("calculator.plans");
  const locale = useLocale() as Locale;
  const [cost, setCost] = useState<number | null>(plan.actual_cost);
  const [revenue, setRevenue] = useState<number | null>(plan.actual_revenue);
  const [busy, setBusy] = useState(false);
  const dirty = cost !== plan.actual_cost || revenue !== plan.actual_revenue;

  async function save(c: number | null, r: number | null) {
    setBusy(true);
    const ok = await api.setActuals(plan.id, c, r);
    setBusy(false);
    if (ok) onDone();
  }

  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="grid grid-cols-2 gap-2">
        <OptionalSilverInput label={t("actualCost")} placeholder={formatInt(plan.snapshot.cost, locale)} value={cost} onChange={setCost} />
        <OptionalSilverInput label={t("actualRevenue")} placeholder={formatInt(plan.snapshot.revenue, locale)} value={revenue} onChange={setRevenue} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{t("actualsHint")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={busy || !dirty} onClick={() => save(cost, revenue)} className={cn(CTA_PRIMARY, "h-9 px-3 text-xs")}>
          {t("saveActuals")}
        </button>
        {(plan.actual_cost !== null || plan.actual_revenue !== null) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => save(null, null)}
            className="h-9 px-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {t("clearActuals")}
          </button>
        )}
      </div>
    </div>
  );
}

function OptionalSilverInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const locale = useLocale() as Locale;
  const [text, setText] = useState(value === null ? "" : formatInt(value, locale));
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground">{label}</span>
      <input
        inputMode="numeric"
        value={text}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
          setText(digits === "" ? "" : formatInt(Number(digits), locale));
          onChange(digits === "" ? null : Number(digits));
        }}
        className="mt-0.5 h-11 w-full rounded-md border border-border bg-background px-2 text-right font-mono text-sm tabular-nums outline-none transition-colors duration-150 placeholder:text-muted-foreground/70 focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30 sm:h-9"
      />
    </label>
  );
}
