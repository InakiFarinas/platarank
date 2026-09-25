"use client";

import { formatInt } from "@/lib/format";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { History, Pin, Search } from "lucide-react";
import { CityGlyph } from "@/components/site-header";
import { enchantLabel, formatAge } from "@/components/recipes/format";
import { REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { CITY_THEMES } from "@/lib/city-theme";
import { itemIconUrl } from "@/lib/item-icons";
import type { CityPricePoint } from "@/lib/recipe-math";
import type { Recipe } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { computeCraft } from "@/lib/craft-calc";
import { isBreedable } from "@/lib/formulas/breeding";
import { PlanList, SavePlanForm, usePlans, type PlanParams } from "@/components/calculator/plans-panel";
import { TransportTool } from "@/components/transport/transport-tool";
import { WebhookForm } from "@/components/alerts/alerts-ui";
import { useAlerts } from "@/components/alerts/use-alerts";
import { AddToSession } from "@/components/sessions/add-to-session";
import { CTA_PRIMARY, CTA_SECONDARY, DisclosureButton, Field, InfoTip, Panel, Segmented, SilverInput } from "@/components/calculator/ui";

type Hit = { itemId: string; baseItemId: string; nameEs: string; tier: number; stationType: string };
type Variant = { itemId: string; tier: number; enchant: number };
type ItemData = { recipe: Recipe; market: Record<string, CityPricePoint[]>; variants: Variant[] };
type Recent = { itemId: string; name: string };

const RECENTS_KEY = "platarank:calc-recents";
const PINNED_KEY = "platarank:calc-pinned";
const STATION_LABEL: Record<string, string> = {
  alchemy: "Alquimia",
  refining: "Refinado",
  cooking: "Cocina",
  gear: "Equipo",
  mount: "Monturas",
};

const DEFAULTS = { qty: 1, premium: true, blackMarket: false, quality: 1, craftCity: "Brecilien", focus: false, feeRate: 500, extraCost: 0 };

/** Everything the player set, as a shareable query string; only non-default values are written. */
function paramsToQuery(itemId: string, p: PlanParams): string {
  const q = new URLSearchParams({ item: itemId });
  if (p.qty !== DEFAULTS.qty) q.set("q", String(p.qty));
  if (p.craftCity !== DEFAULTS.craftCity) q.set("city", p.craftCity);
  if (p.focus) q.set("focus", "1");
  if (!p.premium) q.set("free", "1");
  if (p.blackMarket) q.set("bm", "1");
  if (p.quality !== DEFAULTS.quality) q.set("ql", String(p.quality));
  if (p.feeRate !== DEFAULTS.feeRate) q.set("fee", String(p.feeRate));
  if (p.extraCost !== DEFAULTS.extraCost) q.set("extra", String(p.extraCost));
  if (p.breedOwnMount) q.set("cria", "1");
  if (p.sellOverride !== null) q.set("sell", String(p.sellOverride));
  const mo = Object.entries(p.matOverrides);
  if (mo.length > 0) q.set("mo", mo.map(([id, v]) => `${id}:${v}`).join(";"));
  return q.toString();
}

function paramsFromUrl(sp: URLSearchParams): Partial<PlanParams> {
  const int = (key: string, min: number) => {
    const v = Number(sp.get(key));
    return sp.has(key) && Number.isFinite(v) && v >= min ? Math.round(v) : undefined;
  };
  const city = sp.get("city");
  const matOverrides: Record<string, number> = {};
  for (const part of (sp.get("mo") ?? "").split(";")) {
    const [id, v] = part.split(":");
    const n = Number(v);
    if (id && Number.isFinite(n) && n >= 0) matOverrides[id] = Math.round(n);
  }
  const ql = int("ql", 1);
  return {
    qty: int("q", 1),
    craftCity: city && (REAL_CITIES as readonly string[]).includes(city) ? city : undefined,
    focus: sp.get("focus") === "1" ? true : undefined,
    premium: sp.get("free") === "1" ? false : undefined,
    blackMarket: sp.get("bm") === "1" ? true : undefined,
    quality: ql && ql <= 5 ? ql : undefined,
    feeRate: int("fee", 0),
    extraCost: int("extra", 0),
    breedOwnMount: sp.get("cria") === "1" ? true : undefined,
    sellOverride: int("sell", 0),
    matOverrides: Object.keys(matOverrides).length > 0 ? matOverrides : undefined,
  };
}

function readRecents(): Recent[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function Calculator() {
  const [tab, setTab] = useState<"calc" | "plans" | "transport">("calc");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const loadSeq = useRef(0);
  const [data, setData] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; retryId?: string } | null>(null);
  const [active, setActive] = useState(-1);
  const [advOpen, setAdvOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [srcOpen, setSrcOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [pinned, setPinned] = useState<PinnedCalc | null>(null);
  const [announce, setAnnounce] = useState("");
  const [recents, setRecents] = useState<Recent[]>([]);

  const [qty, setQty] = useState(1);
  const [premium, setPremium] = useState(true);
  const [blackMarket, setBlackMarket] = useState(false);
  const [quality, setQuality] = useState(1);
  const [craftCity, setCraftCity] = useState<Location>("Brecilien");
  const [focus, setFocus] = useState(false);
  const [feeRate, setFeeRate] = useState(235);
  const [extraCost, setExtraCost] = useState(0);
  const [breedOwnMount, setBreedOwnMount] = useState(false);
  const [sellOverride, setSellOverride] = useState<number | null>(null);
  const [matOverrides, setMatOverrides] = useState<Record<string, number>>({});

  const plansApi = usePlans();
  const alertsApi = useAlerts(plansApi.signedIn === true);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecents(readRecents());
    const sp = new URLSearchParams(window.location.search);
    const id = sp.get("item");
    if (id) void load(id).then((ok) => ok && applyParams(paramsFromUrl(sp)));
  }, []);

  // "/" jumps to the search box, like most tools with a global search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (e.key !== "/" || t?.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearchFailed(false);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/calculator/search?q=${encodeURIComponent(query.trim())}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        setHits(await res.json());
        setActive(0);
        setSearching(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setHits([]);
        setSearchFailed(true);
        setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  async function load(id: string, keepQuality = false): Promise<boolean> {
    const seq = ++loadSeq.current;
    setError(null);
    setLoading(true);
    let next: ItemData;
    try {
      const res = await fetch(`/api/calculator/item?id=${encodeURIComponent(id)}`);
      if (seq !== loadSeq.current) return false;
      if (res.status === 404) {
        setLoading(false);
        setError({ message: "No se encontró ese ítem." });
        return false;
      }
      if (!res.ok) throw new Error(String(res.status));
      next = await res.json();
    } catch {
      if (seq !== loadSeq.current) return false;
      setLoading(false);
      setError({ message: "No se pudo cargar el ítem. Revisá tu conexión y probá de nuevo.", retryId: id });
      return false;
    }
    if (seq !== loadSeq.current) return false;
    setLoading(false);
    setData(next);
    setTab("calc");
    if (!keepQuality) setQuality(1);
    setSellOverride(null);
    setMatOverrides({});
    setHits([]);
    setQuery("");
    const entry = { itemId: id, name: `${next.recipe.nameEs} T${next.recipe.tier}${enchantLabel(next.recipe.enchant)}` };
    const updated = [entry, ...readRecents().filter((r) => r.itemId !== id)].slice(0, 6);
    setRecents(updated);
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    } catch {
      // Recents are a convenience; private windows / blocked storage just skip them.
    }
    return true;
  }

  function applyParams(p: Partial<PlanParams>) {
    if (p.qty !== undefined) setQty(p.qty);
    if (p.premium !== undefined) setPremium(p.premium);
    if (p.blackMarket !== undefined) setBlackMarket(p.blackMarket);
    if (p.quality !== undefined) setQuality(p.quality);
    if (p.craftCity !== undefined) setCraftCity(p.craftCity as Location);
    if (p.focus !== undefined) setFocus(p.focus);
    if (p.feeRate !== undefined) setFeeRate(p.feeRate);
    if (p.extraCost !== undefined) setExtraCost(p.extraCost);
    if (p.breedOwnMount !== undefined) setBreedOwnMount(p.breedOwnMount);
    if (p.sellOverride !== undefined) setSellOverride(p.sellOverride);
    if (p.matOverrides !== undefined) setMatOverrides(p.matOverrides);
  }

  async function openPlan(id: string, p: PlanParams) {
    if (!(await load(id))) return;
    applyParams(p);
  }

  const calc = useMemo(
    () =>
      data
        ? computeCraft(data.recipe, data.market, {
            qty,
            premium,
            blackMarket,
            quality,
            craftCity,
            focus,
            feeRate,
            extraCost,
            breedOwnMount,
            sellOverride,
            matOverrides,
          })
        : null,
    [data, qty, premium, blackMarket, quality, craftCity, focus, feeRate, extraCost, breedOwnMount, sellOverride, matOverrides],
  );

  // Keep the address bar a shareable snapshot of the calculation.
  useEffect(() => {
    if (!data) return;
    // Debounced and guarded: Safari throws SecurityError past ~100 replaceState calls per 30 s.
    const t = setTimeout(() => {
      try {
        window.history.replaceState(
          null,
          "",
          `?${paramsToQuery(data.recipe.itemId, { qty, premium, blackMarket, quality, craftCity, focus, feeRate, extraCost, breedOwnMount, sellOverride, matOverrides })}`,
        );
      } catch {
        // The address bar just stops mirroring the calculation; nothing else depends on it.
      }
    }, 300);
    return () => clearTimeout(t);
  }, [data, qty, premium, blackMarket, quality, craftCity, focus, feeRate, extraCost, breedOwnMount, sellOverride, matOverrides]);

  // Screen readers hear the bottom line once typing pauses, not on every keystroke.
  useEffect(() => {
    if (!calc) return;
    const t = setTimeout(
      () => setAnnounce(`Ganancia ${calc.profit >= 0 ? "" : "menos "}${formatInt(Math.abs(calc.profit))}${calc.incomplete ? ", incompleta" : ""}`),
      900,
    );
    return () => clearTimeout(t);
  }, [calc]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("ok");
    } catch {
      setCopyState("fail");
    }
    setTimeout(() => setCopyState("idle"), 2500);
  }

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PINNED_KEY);
      if (saved) setPinned(JSON.parse(saved));
    } catch {
      // A missing or corrupt value just means no comparison is pinned.
    }
  }, []);

  useEffect(() => {
    try {
      if (pinned) sessionStorage.setItem(PINNED_KEY, JSON.stringify(pinned));
      else sessionStorage.removeItem(PINNED_KEY);
    } catch {
      // Storage can be blocked (private windows); the comparison then lasts until reload.
    }
  }, [pinned]);

  const hiddenCities = calc ? REAL_CITIES.length - new Set([craftCity, calc.spec?.city].filter(Boolean)).size : 0;

  const tiers = data ? [...new Set(data.variants.map((v) => v.tier))].sort((a, b) => a - b) : [];
  const enchants = data ? data.variants.filter((v) => v.tier === data.recipe.tier).map((v) => v.enchant).sort((a, b) => a - b) : [];
  const variantId = (tier: number, enchant: number) =>
    data?.variants.find((v) => v.tier === tier && v.enchant === enchant)?.itemId ?? data?.variants.find((v) => v.tier === tier)?.itemId;

  const draft =
    data && calc
      ? {
          itemId: data.recipe.itemId,
          itemName: `${data.recipe.nameEs} T${data.recipe.tier}${enchantLabel(data.recipe.enchant)}`,
          params: {
            qty,
            premium,
            blackMarket,
            quality,
            craftCity,
            focus,
            feeRate,
            extraCost,
            breedOwnMount,
            sellOverride,
            matOverrides,
          } satisfies PlanParams,
          snapshot: { cost: calc.cost, revenue: calc.revenue, profit: calc.profit, sellPrice: calc.sellPrice },
        }
      : null;

  return (
    <div className="mt-2 pb-24 lg:pb-0">
      {/* Search + tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-72">
          <label className="flex h-11 items-center gap-2.5 rounded-md border border-border bg-card/40 px-3 transition-colors duration-150 focus-within:border-money focus-within:ring-2 focus-within:ring-money/30">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (hits.length === 0) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => (i + 1) % hits.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => (i - 1 + hits.length) % hits.length);
                } else if (e.key === "Enter" && hits[active]) {
                  e.preventDefault();
                  void load(hits[active].itemId);
                } else if (e.key === "Escape") {
                  setHits([]);
                }
              }}
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls="calc-hits"
              aria-autocomplete="list"
              aria-activedescendant={hits.length > 0 && active >= 0 ? `calc-hit-${active}` : undefined}
              onBlur={() => setHits([])}
              placeholder="Buscar ítem: poción, bastón, capa, montura…"
              aria-label="Buscar ítem"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searching && <span className="shrink-0 text-xs text-muted-foreground">Buscando…</span>}
          </label>
          <span role="status" className="sr-only">
            {hits.length > 0
              ? `${hits.length} resultados`
              : searchFailed
                ? "No se pudo buscar"
                : query.trim().length >= 2 && !searching
                  ? "Sin resultados"
                  : ""}
          </span>
          {query.trim().length >= 2 && !searching && hits.length === 0 && (
            <p className="absolute inset-x-0 top-full z-20 mt-1 rounded-md border border-border bg-popover px-3 py-3 text-sm text-muted-foreground">
              {searchFailed ? "No se pudo buscar. Revisá tu conexión y seguí escribiendo para reintentar." : `Sin resultados para "${query.trim()}".`}
            </p>
          )}
          {hits.length > 0 && (
            <ul
              id="calc-hits"
              role="listbox"
              aria-label="Resultados"
              onMouseDown={(e) => e.preventDefault()}
              className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-auto rounded-md border border-border bg-popover"
            >
              {hits.map((h, i) => (
                <li
                  key={h.itemId}
                  id={`calc-hit-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => load(h.itemId)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left text-sm transition-colors duration-150",
                    i === active && "bg-accent/40",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={itemIconUrl(h.itemId, 1, 64)} alt="" width={32} height={32} className="h-8 w-8" />
                  <span className="flex-1">{h.nameEs}</span>
                  <span className="text-xs text-muted-foreground">{STATION_LABEL[h.stationType] ?? h.stationType}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          role="tablist"
          aria-label="Secciones"
          onKeyDown={(e) => {
            const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
            if (!keys.includes(e.key)) return;
            e.preventDefault();
            const order = ["calc", "plans", "transport"] as const;
            const i = order.indexOf(tab);
            const next =
              e.key === "Home" ? order[0] : e.key === "End" ? order[order.length - 1] : order[(i + (e.key === "ArrowLeft" ? -1 : 1) + order.length) % order.length];
            setTab(next);
            document.getElementById(`tab-${next}`)?.focus();
          }}
          className="flex shrink-0 rounded-md border border-border p-0.5"
        >
          {(
            [
              ["calc", "Calculadora"],
              ["plans", `Planificaciones${plansApi.plans.length ? ` (${plansApi.plans.length})` : ""}`],
              ["transport", "Transporte"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-controls="calc-panel"
              aria-selected={tab === key}
              tabIndex={tab === key ? 0 : -1}
              onClick={() => setTab(key)}
              className={cn(
                "h-9 rounded-[5px] px-3.5 text-xs font-medium transition-colors duration-150",
                tab === key ? "bg-money/15 text-money" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error.message}
          {error.retryId && (
            <button type="button" onClick={() => load(error.retryId!)} className="ml-2 underline underline-offset-2">
              Reintentar
            </button>
          )}
        </p>
      )}

      <div role="tabpanel" id="calc-panel" aria-labelledby={`tab-${tab}`}>
      {tab === "plans" ? (
        <Panel title="Planificaciones" className="mt-4">
          <h2 className="sr-only">Planificaciones guardadas</h2>
          {plansApi.signedIn && plansApi.plans.length > 0 && (
            <div className="mb-4">
              <WebhookForm api={alertsApi} />
            </div>
          )}
          <PlanList api={plansApi} alertsApi={alertsApi} onOpen={openPlan} />
        </Panel>
      ) : tab === "transport" ? (
        <TransportTool />
      ) : !data || !calc || !draft ? (
        <EmptyState loading={loading} recents={recents} onPick={load} onFocusSearch={() => searchRef.current?.focus()} />
      ) : (
        <div aria-busy={loading} className={cn("mt-4 grid items-start gap-4 transition-opacity duration-150 lg:grid-cols-[minmax(0,1fr)_23rem]", loading && "opacity-60")}>
          <div className="space-y-4">
            {/* Item + tier/enchant */}
            <section className="rounded-md border border-border bg-card/40 p-4">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={itemIconUrl(data.recipe.itemId, quality, 128)} alt="" width={64} height={64} className="h-16 w-16 shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-heading text-2xl leading-tight">{data.recipe.nameEs}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {STATION_LABEL[data.recipe.stationType]} · lote de {data.recipe.batchSize} · foco base {formatInt(data.recipe.craftingFocus)}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Segmented
                  label="Tier"
                  value={data.recipe.tier}
                  options={tiers.map((t) => ({ value: t, text: `T${t}` }))}
                  onChange={(t) => {
                    const id = variantId(t, data.recipe.enchant);
                    if (id) void load(id, true);
                  }}
                />
                <Segmented
                  label="Encantamiento"
                  value={data.recipe.enchant}
                  options={enchants.map((e) => ({ value: e, text: `.${e}` }))}
                  onChange={(e) => {
                    const id = variantId(data.recipe.tier, e);
                    if (id) void load(id, true);
                  }}
                />
              </div>
            </section>

            {/* City: the single choice that decides the crafting bonus and fee, so it gets its own
             * panel up front instead of being one more row inside "Condiciones". */}
            <Panel title="Ciudad de crafteo">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {[...REAL_CITIES]
                  .sort((x, y) => Number(calc.spec?.city === y) - Number(calc.spec?.city === x))
                  .filter((city) => citiesOpen || city === craftCity || city === calc.spec?.city)
                  .map((city) => {
                  const theme = CITY_THEMES[city];
                  const active = city === craftCity;
                  const bonus = calc.spec && calc.spec.city === city ? (calc.spec.kind === "refining" ? "+40%" : "+15%") : null;
                  return (
                    <button
                      key={city}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCraftCity(city)}
                      className={cn(
                        "flex h-14 flex-col items-center justify-center gap-1 rounded-md border-2 px-1 text-sm leading-none transition-colors duration-150",
                        active ? cn(theme.border, theme.bg, theme.text) : "border-border text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <CityGlyph theme={theme} />
                        <span className="truncate font-medium">{city}</span>
                      </span>
                      {bonus && <span className="font-mono text-xs text-money">{bonus} bono</span>}
                    </button>
                  );
                })}
              </div>
              {(hiddenCities > 0 || citiesOpen) && (
                <DisclosureButton
                  open={citiesOpen}
                  onToggle={() => setCitiesOpen((o) => !o)}
                  className="mt-2 flex items-center gap-1.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {citiesOpen ? "Mostrar menos ciudades" : `Otras ciudades (${hiddenCities})`}
                </DisclosureButton>
              )}
            </Panel>

            {/* Conditions */}
            <Panel title="Condiciones">
              <div className="grid gap-4 sm:grid-cols-3">
                <Segmented
                  label="Cuenta"
                  value={premium ? "p" : "n"}
                  options={[
                    { value: "p", text: "Premium" },
                    { value: "n", text: "Sin premium" },
                  ]}
                  onChange={(v) => setPremium(v === "p")}
                />
                <Segmented
                  label="Mercado de venta"
                  value={blackMarket ? "bm" : "royal"}
                  options={[
                    { value: "royal", text: "Ciudades" },
                    { value: "bm", text: "Black Market" },
                  ]}
                  onChange={(v) => {
                    setBlackMarket(v === "bm");
                    setSellOverride(null);
                  }}
                />
                <Segmented
                  label="Foco"
                  value={focus ? "f" : "n"}
                  options={[
                    { value: "n", text: "Sin foco" },
                    { value: "f", text: "Con foco" },
                  ]}
                  onChange={(v) => setFocus(v === "f")}
                />
                {data.recipe.stationType === "mount" && data.recipe.materials.some((m) => isBreedable(m.itemId)) && (
                  <Segmented
                    label="Animal base"
                    value={breedOwnMount ? "cria" : "compra"}
                    options={[
                      { value: "compra", text: "Comprado" },
                      { value: "cria", text: "Criado" },
                    ]}
                    onChange={(v) => setBreedOwnMount(v === "cria")}
                  />
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Cantidad a craftear">
                  <SilverInput label="Cantidad a craftear" value={qty} onChange={(v) => setQty(Math.min(1_000_000, Math.max(1, v)))} />
                </Field>
                <Field
                  label="Precio de venta (c/u)"
                  hint={
                    sellOverride !== null ? (
                      <button type="button" onClick={() => setSellOverride(null)} className="py-1 text-money underline underline-offset-2">
                        volver a auto
                      </button>
                    ) : calc.oldestAge !== null ? (
                      formatAge(calc.oldestAge)
                    ) : undefined
                  }
                >
                  <SilverInput
                    label="Precio de venta"
                    value={Math.round(calc.sellPrice)}
                    onChange={setSellOverride}
                    edited={sellOverride !== null}
                    invalid={calc.sellAuto === null && sellOverride === null}
                  />
                </Field>
                {data.recipe.stationType === "gear" && (
                  <Segmented
                    label="Calidad"
                    value={quality}
                    options={[1, 2, 3, 4, 5].map((q) => ({
                      value: q,
                      text: `Q${q}`,
                      title: ["Normal", "Bueno", "Excepcional", "Excelente", "Obra maestra"][q - 1],
                    }))}
                    onChange={(q) => {
                      setQuality(q);
                      setSellOverride(null);
                    }}
                  />
                )}
              </div>

              <DisclosureButton
                open={advOpen}
                onToggle={() => setAdvOpen((o) => !o)}
                className="mt-4 flex items-center gap-1.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Configuración avanzada
                {(feeRate !== 235 || extraCost > 0) && <span className="text-money">(editada)</span>}
              </DisclosureButton>
              {advOpen && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Tarifa de estación (por 100 nutrición)" hint={<InfoTip term="¿Qué es?" text="Plata que cobra la estación por cada 100 de nutrición que consume tu craft. La fija el dueño de la estación y la ves en el juego como tarifa de uso." />}>
                    <SilverInput label="Tarifa de estación" value={feeRate} onChange={setFeeRate} />
                  </Field>
                  <Field label="Costos extra (total)">
                    <SilverInput label="Costos extra" value={extraCost} onChange={setExtraCost} />
                  </Field>
                </div>
              )}
              {calc.sellAuto === null && sellOverride === null && (
                <p className="mt-3 text-xs text-destructive">
                  Sin precio de venta reciente para esta calidad y mercado. Escribí uno a mano para calcular.
                </p>
              )}
            </Panel>

            {/* Materials */}
            <Panel
              title="Materiales"
              aside={
                <>
                  <InfoTip term="Retorno" text="Porcentaje de los materiales que el juego te devuelve al craftear. Sube con el bono de la ciudad y con el foco; los artefactos nunca devuelven." />{" "}
                  <span className="font-mono text-money">{(calc.rrr * 100).toFixed(1).replace(".", ",")}%</span>
                  {calc.specActive && ` · bono de ${calc.spec!.city}`}
                </>
              }
            >
              <ul className="-my-1 divide-y divide-border">
                {calc.materials.map(({ m, price, auto, cheapest, noReturn, bred, effective }) => {
                  const edited = matOverrides[m.itemId] !== undefined;
                  return (
                    <li
                      key={m.itemId}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-3 sm:grid-cols-[auto_minmax(0,1fr)_9rem_6.5rem]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={itemIconUrl(m.itemId, 1, 64)} alt="" width={40} height={40} className="h-10 w-10" />
                      <div className="min-w-0">
                        <div className="truncate text-sm">{m.nameEs}</div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-mono">
                            {m.count} → {effective.toFixed(2).replace(".", ",")}
                          </span>
                          {noReturn ? " · sin retorno" : ""}
                          {bred && !edited ? " · criado, no comprado" : cheapest && !edited ? ` · ${cheapest}` : ""}
                        </div>
                      </div>
                      <div className="col-span-3 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1">
                        <SilverInput
                          label={`Precio de ${m.nameEs}`}
                          value={Math.round(price)}
                          onChange={(v) => setMatOverrides((o) => ({ ...o, [m.itemId]: v }))}
                          edited={edited}
                          invalid={auto === null && !edited}
                        />
                        {edited && (
                          <button
                            type="button"
                            onClick={() =>
                              setMatOverrides((o) => {
                                const rest = { ...o };
                                delete rest[m.itemId];
                                return rest;
                              })
                            }
                            className="mt-1 block py-1.5 text-xs text-money underline underline-offset-2"
                          >
                            volver a auto
                          </button>
                        )}
                        {auto === null && !edited && <span className="mt-1 block text-xs text-destructive">sin precio: escribilo</span>}
                      </div>
                      <div className="col-start-3 row-start-1 text-right font-mono text-sm tabular-nums sm:col-start-4">
                        {formatInt(price * effective * calc.crafts)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>

          {/* Ledger */}
          <aside id="balance" className="scroll-mt-24 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <section className="rounded-md border-2 border-double border-money/30 bg-card/60">
              <header className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5">
                <h3 className="font-heading text-base">Balance</h3>
                <button
                  type="button"
                  onClick={copyLink}
                  className="py-1.5 text-xs text-money underline-offset-2 transition-colors hover:underline"
                >
                  {copyState === "ok" ? "Enlace copiado" : copyState === "fail" ? "No se pudo copiar" : "Copiar enlace"}
                </button>
              </header>
              <span role="status" className="sr-only">
                {announce}
                {copyState === "ok" ? " Enlace copiado" : copyState === "fail" ? " No se pudo copiar el enlace" : ""}
              </span>
              <div className="space-y-4 p-4 text-sm">
                <dl className="space-y-1.5">
                  <Line label={`Materiales (${calc.crafts} ${calc.crafts === 1 ? "craft" : "crafts"})`} value={formatInt(calc.materialsTotal)} />
                  <Line label={`Estación (${formatInt(calc.feePerCraft)} por craft × ${calc.crafts})`} value={formatInt(calc.feeTotal)} />
                  {extraCost > 0 && <Line label="Costos extra" value={formatInt(extraCost)} />}
                  <Line label="Inversión" value={formatInt(calc.cost)} total />
                </dl>
                <dl className="space-y-1.5">
                  <Line label={`Bruto (${formatInt(calc.produced)} × ${formatInt(calc.sellPrice)})`} value={formatInt(calc.gross)} />
                  <Line label={`Impuestos ${(calc.taxRate * 100).toFixed(1).replace(".", ",")}%`} value={`−${formatInt(calc.gross * calc.taxRate)}`} />
                  <Line label="Ingreso neto" value={formatInt(calc.revenue)} total />
                </dl>

                <div className="border-t-2 border-double border-money/30 pt-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-heading text-base">
                      Ganancia
                      {calc.incomplete && <span className="ml-2 font-sans text-xs text-destructive">incompleta</span>}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-2xl tabular-nums",
                        calc.incomplete ? "text-muted-foreground" : calc.profit >= 0 ? "text-money" : "text-destructive",
                      )}
                    >
                      {calc.profit >= 0 ? "+" : "−"}
                      {formatInt(Math.abs(calc.profit))}
                    </span>
                  </div>
                  {calc.incomplete && (
                    <p className="mt-2 text-xs text-destructive">
                      {calc.unpriced > 0 &&
                        `${calc.unpriced} ${calc.unpriced === 1 ? "material sin precio cuenta" : "materiales sin precio cuentan"} como 0. `}
                      {calc.sellAuto === null && sellOverride === null && "Falta el precio de venta. "}
                      Completá lo que falta para que la ganancia sea real.
                    </p>
                  )}
                  <dl className="mt-2 space-y-1 text-xs">
                    <Line label="Margen sobre inversión" value={calc.margin === null ? "--" : `${Math.round(calc.margin * 100)}%`} muted />
                    <Line label="Ganancia por unidad" value={formatInt(calc.perUnit)} muted />
                    {focus && <Line label="Foco necesario (sin maestrías)" value={formatInt(calc.focusTotal)} muted />}
                    <Line label="Volumen de ventas (por día)" value={formatInt(calc.volume)} muted />
                  </dl>
                  <DisclosureButton
                    open={srcOpen}
                    onToggle={() => setSrcOpen((o) => !o)}
                    className="mt-2 flex items-center gap-1.5 py-1.5 text-xs text-money underline-offset-2 hover:underline"
                  >
                    De dónde sale el precio de venta
                  </DisclosureButton>
                  {srcOpen && <SellSource calc={calc} edited={sellOverride !== null} quality={quality} />}
                </div>

                <div className="border-t border-border pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPinned({
                        name: draft.itemName,
                        profit: calc.profit,
                        margin: calc.margin,
                        perUnit: calc.perUnit,
                        volume: calc.volume,
                        incomplete: calc.incomplete,
                      })
                    }
                    className="flex items-center gap-1.5 py-1.5 text-xs text-money underline-offset-2 hover:underline"
                  >
                    <Pin className="h-3.5 w-3.5" />
                    {pinned ? "Fijar este en lugar del anterior" : "Fijar para comparar"}
                  </button>
                  {pinned && <CompareCard pinned={pinned} name={draft.itemName} calc={calc} onClear={() => setPinned(null)} />}
                </div>

                <div className="border-t border-border pt-3">
                  <DisclosureButton
                    open={saveOpen}
                    onToggle={() => setSaveOpen((o) => !o)}
                    chevronPosition="end"
                    className={cn(CTA_SECONDARY, "flex w-full items-center justify-between px-3 py-2 text-xs")}
                  >
                    Guardar este cálculo
                  </DisclosureButton>
                  {saveOpen && (
                    <div className="mt-3 space-y-3">
                      <SavePlanForm api={plansApi} draft={draft} />
                      <div className="border-t border-border pt-3">
                        <AddToSession draft={draft} />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Retorno, tarifa de estación e impuestos: <Link href="/es/metodologia" className="text-money underline underline-offset-2">cómo se calcula</Link>.
                </p>
              </div>
            </section>
          </aside>

          {/* Phone: the balance is a scroll away, so its bottom line stays in reach. */}
          <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t-2 border-double border-money/30 bg-card px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:hidden">
            <div>
              <div className="text-xs text-muted-foreground">Ganancia{calc.incomplete && " (incompleta)"}</div>
              <div
                className={cn("font-mono text-lg tabular-nums", calc.incomplete ? "text-muted-foreground" : calc.profit >= 0 ? "text-money" : "text-destructive")}
              >
                {calc.profit >= 0 ? "+" : "−"}
                {formatInt(Math.abs(calc.profit))}
              </div>
            </div>
            <a href="#balance" className="rounded-sm border border-money bg-money px-3.5 py-2 text-xs font-medium tracking-wide text-money-foreground">
              Ver balance
            </a>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

type PinnedCalc = { name: string; profit: number; margin: number | null; perUnit: number; volume: number; incomplete: boolean };

/** Side-by-side of a pinned calculation against the one on screen, so two recipes can be weighed
 * without writing numbers down. The better profit is the only value in gold. */
function CompareCard({ pinned, name, calc, onClear }: { pinned: PinnedCalc; name: string; calc: ReturnType<typeof computeCraft>; onClear: () => void }) {
  const pct = (m: number | null) => (m === null ? "--" : `${Math.round(m * 100)}%`);
  const currentBetter = calc.profit > pinned.profit;
  const rows: { label: string; a: string; b: string; win?: "a" | "b" }[] = [
    { label: "Ganancia", a: formatInt(pinned.profit), b: formatInt(calc.profit), win: currentBetter ? "b" : pinned.profit > calc.profit ? "a" : undefined },
    { label: "Margen", a: pct(pinned.margin), b: pct(calc.margin) },
    { label: "Por unidad", a: formatInt(pinned.perUnit), b: formatInt(calc.perUnit) },
    { label: "Volumen", a: formatInt(pinned.volume), b: formatInt(calc.volume) },
  ];
  return (
    <div className="mt-2 rounded-md border border-border bg-background/40 p-3 text-xs">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1">
        <span aria-hidden="true" />
        <span className="pb-1 text-right leading-tight">
          <span className="block text-xs text-muted-foreground">Fijado</span>
          <span className="block break-words">{pinned.name}</span>
        </span>
        <span className="pb-1 text-right leading-tight">
          <span className="block text-xs text-muted-foreground">Actual</span>
          <span className="block break-words">{name}</span>
        </span>
        {rows.map((r) => (
          <div key={r.label} className="contents">
            <span className="text-muted-foreground">{r.label}</span>
            <span className={cn("text-right font-mono tabular-nums", r.win === "a" && !pinned.incomplete && "text-money")}>{r.a}</span>
            <span className={cn("text-right font-mono tabular-nums", r.win === "b" && !calc.incomplete && "text-money")}>{r.b}</span>
          </div>
        ))}
      </div>
      {(pinned.incomplete || calc.incomplete) && <p className="mt-2 text-destructive">Alguno de los dos tiene datos incompletos; no lo tomes como comparación real.</p>}
      <button type="button" onClick={onClear} className="mt-2 py-1.5 text-muted-foreground underline underline-offset-2 hover:text-foreground">
        Quitar comparación
      </button>
    </div>
  );
}

const DISCARD_REASON: Record<string, string> = {
  outlier_low: "muy por debajo de la mediana",
  outlier_high: "muy por encima de la mediana",
  outlier_self: "muy lejos del propio promedio de 30 días de esa ciudad",
};

function SellSource({ calc, edited, quality }: { calc: ReturnType<typeof computeCraft>; edited: boolean; quality: number }) {
  return (
    <div className="mt-2 rounded-md border border-border bg-background/40 p-3 text-xs">
      {edited && <p className="mb-2 text-money">Estás usando un precio escrito a mano; las cotizaciones son solo de referencia.</p>}
      {calc.sellBreakdown.length === 0 ? (
        <p className="text-muted-foreground">No hay cotizaciones recientes para esta calidad y mercado.</p>
      ) : (
        <>
          <p className="mb-2 text-muted-foreground">
            Mediana de {calc.sellCities} {calc.sellCities === 1 ? "mercado" : "mercados"} (calidad Q{quality}). Las cotizaciones muy lejos de la mediana se descartan.
          </p>
          <ul className="divide-y divide-border">
            {calc.sellBreakdown.map((q) => (
              <li key={q.city} className={cn("flex items-baseline justify-between gap-3 py-1.5", q.discarded && "opacity-60")}>
                <span>
                  {q.city}
                  <span className="ml-2 text-muted-foreground">{formatAge(q.ageSeconds)}</span>
                  {q.discarded && <span className="ml-2 text-destructive">descartado: {DISCARD_REASON[q.discarded] ?? q.discarded}</span>}
                </span>
                <span className="font-mono tabular-nums">{formatInt(q.price)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Line({ label, value, total, muted }: { label: string; value: string; total?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", total && "border-t border-border pt-1.5 font-medium")}>
      <dt className={cn(total && !muted ? "text-foreground" : "text-muted-foreground")}>{label}</dt>
      <dd className={cn("font-mono tabular-nums", muted && "text-muted-foreground")}>{value}</dd>
    </div>
  );
}

function EmptyState({
  loading,
  recents,
  onPick,
  onFocusSearch,
}: {
  loading: boolean;
  recents: Recent[];
  onPick: (id: string) => void;
  onFocusSearch: () => void;
}) {
  if (loading) {
    return (
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]" aria-busy="true">
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-md bg-card/40" />
          <div className="h-56 animate-pulse rounded-md bg-card/40" />
        </div>
        <div className="h-72 animate-pulse rounded-md bg-card/40" />
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-md border border-dashed border-border px-4 py-12 text-center">
      <h2 className="font-heading text-xl">¿Qué vas a craftear?</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Buscá un ítem y ajustá tier, encantamiento, ciudad y precios. El balance muestra de dónde sale cada número.
      </p>
      <button
        type="button"
        onClick={onFocusSearch}
        className={cn(CTA_PRIMARY, "mt-4 px-4 py-2 text-sm")}
      >
        Buscar ítem
      </button>
      {recents.length > 0 && (
        <div className="mx-auto mt-8 max-w-xl text-left">
          <h3 className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <History className="h-3.5 w-3.5" /> Vistos recientemente
          </h3>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {recents.map((r) => (
              <li key={r.itemId}>
                <button
                  type="button"
                  onClick={() => onPick(r.itemId)}
                  className="flex w-full items-center gap-2.5 rounded-md border border-border px-2.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-accent/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={itemIconUrl(r.itemId, 1, 64)} alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
                  <span className="truncate">{r.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
