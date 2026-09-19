"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { History, Search } from "lucide-react";
import { CityGlyph } from "@/components/site-header";
import { enchantLabel, formatAge } from "@/components/recipes/format";
import { BLACK_MARKET, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { getCitySpecialty } from "@/lib/city-specialties";
import { CITY_THEMES } from "@/lib/city-theme";
import { itemIconUrl } from "@/lib/item-icons";
import { robustStat, type CityQuote } from "@/lib/formulas/outliers";
import { craftingFeePerBatch } from "@/lib/formulas/station-fee";
import { returnRate } from "@/lib/formulas/return-rate";
import type { CityPricePoint } from "@/lib/recipe-math";
import type { Recipe } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { PlanList, SavePlanForm, usePlans, type PlanParams } from "@/components/calculator/plans-panel";
import { Field, Panel, Segmented, SilverInput } from "@/components/calculator/ui";

type Hit = { itemId: string; baseItemId: string; nameEs: string; tier: number; stationType: string };
type Variant = { itemId: string; tier: number; enchant: number };
type ItemData = { recipe: Recipe; market: Record<string, CityPricePoint[]>; variants: Variant[] };
type Recent = { itemId: string; name: string };

const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");
const SETUP_FEE = 0.025;
const RECENTS_KEY = "platarank:calc-recents";
const STATION_LABEL: Record<string, string> = {
  alchemy: "Alquimia",
  refining: "Refinado",
  cooking: "Cocina",
  gear: "Equipo",
  mount: "Monturas",
};

function readRecents(): Recent[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function Calculator() {
  const [tab, setTab] = useState<"calc" | "plans">("calc");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [data, setData] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recents, setRecents] = useState<Recent[]>([]);

  const [qty, setQty] = useState(1);
  const [premium, setPremium] = useState(true);
  const [blackMarket, setBlackMarket] = useState(false);
  const [quality, setQuality] = useState(1);
  const [craftCity, setCraftCity] = useState<Location>("Brecilien");
  const [focus, setFocus] = useState(false);
  const [feeRate, setFeeRate] = useState(235);
  const [extraCost, setExtraCost] = useState(0);
  const [sellOverride, setSellOverride] = useState<number | null>(null);
  const [matOverrides, setMatOverrides] = useState<Record<string, number>>({});

  const plansApi = usePlans();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecents(readRecents());
    const id = new URLSearchParams(window.location.search).get("item");
    if (id) void load(id);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/calculator/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) setHits(await res.json());
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function load(id: string): Promise<boolean> {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/calculator/item?id=${encodeURIComponent(id)}`);
    setLoading(false);
    if (!res.ok) {
      setError("No se encontró ese ítem.");
      return false;
    }
    const next: ItemData = await res.json();
    setData(next);
    setTab("calc");
    setQuality(1);
    setSellOverride(null);
    setMatOverrides({});
    setHits([]);
    setQuery("");
    window.history.replaceState(null, "", `?item=${encodeURIComponent(id)}`);
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

  async function openPlan(id: string, p: PlanParams) {
    if (!(await load(id))) return;
    setQty(p.qty);
    setPremium(p.premium);
    setBlackMarket(p.blackMarket);
    setQuality(p.quality);
    setCraftCity(p.craftCity as Location);
    setFocus(p.focus);
    setFeeRate(p.feeRate);
    setExtraCost(p.extraCost);
    setSellOverride(p.sellOverride);
    setMatOverrides(p.matOverrides);
  }

  const calc = useMemo(() => {
    if (!data) return null;
    const { recipe, market } = data;
    const spec = getCitySpecialty(recipe.craftingCategory);
    const specActive = spec !== null && spec.city === craftCity;
    const rrr = returnRate({
      cityCraftingSpecialty: specActive && spec!.kind === "crafting",
      cityRefiningSpecialty: specActive && spec!.kind === "refining",
      focus,
    });

    const materials = recipe.materials.map((m) => {
      const points = (market[m.itemId] ?? []).filter((p) => p.quality === 1 && p.price !== null && p.city !== BLACK_MARKET);
      const quotes: CityQuote[] = points.map((p) => ({ city: p.city, price: p.price! }));
      const stat = robustStat(quotes, "min");
      const cheapest = stat.result.kept.find((q) => q.price === stat.value)?.city ?? null;
      const price = matOverrides[m.itemId] ?? stat.value ?? 0;
      const noReturn = m.category === "artifact";
      return { m, price, auto: stat.value, cheapest, noReturn, effective: m.count * (1 - (noReturn ? 0 : rrr)) };
    });

    const sellPoints = (market[recipe.itemId] ?? []).filter(
      (p) => p.quality === quality && p.price !== null && (blackMarket ? p.city === BLACK_MARKET : p.city !== BLACK_MARKET),
    );
    const sellStat = robustStat(sellPoints.map((p) => ({ city: p.city, price: p.price! })), "median");
    const sellPrice = sellOverride ?? sellStat.value ?? 0;
    const ages = sellPoints.map((p) => p.priceAgeSeconds).filter((a): a is number => a !== null);
    const volume = sellPoints.reduce((s, p) => s + p.avgDailyVolume30d, 0);

    const crafts = Math.ceil(qty / recipe.batchSize);
    const produced = crafts * recipe.batchSize;
    const feePerCraft = craftingFeePerBatch(Number(recipe.materialItemValue), feeRate);
    const materialsTotal = materials.reduce((s, x) => s + x.price * x.effective, 0) * crafts;
    const feeTotal = feePerCraft * crafts;
    const cost = materialsTotal + feeTotal + extraCost;
    const taxRate = (premium ? 0.04 : 0.08) + SETUP_FEE;
    const gross = sellPrice * produced;
    const revenue = gross * (1 - taxRate);
    const profit = revenue - cost;

    return {
      spec,
      specActive,
      rrr,
      materials,
      sellPrice,
      sellAuto: sellStat.value,
      sellCities: sellStat.result.kept.length,
      oldestAge: ages.length ? Math.max(...ages) : null,
      volume,
      crafts,
      produced,
      feePerCraft,
      materialsTotal,
      feeTotal,
      cost,
      taxRate,
      gross,
      revenue,
      profit,
      margin: cost > 0 ? profit / cost : null,
      perUnit: produced > 0 ? profit / produced : 0,
      focusTotal: focus ? recipe.craftingFocus * crafts : 0,
      unpriced: materials.filter((x) => x.auto === null && matOverrides[x.m.itemId] === undefined).length,
    };
  }, [data, qty, premium, blackMarket, quality, craftCity, focus, feeRate, extraCost, sellOverride, matOverrides]);

  const tiers = data ? [...new Set(data.variants.map((v) => v.tier))].sort((a, b) => a - b) : [];
  const enchants = data ? data.variants.filter((v) => v.tier === data.recipe.tier).map((v) => v.enchant).sort((a, b) => a - b) : [];
  const variantId = (tier: number, enchant: number) =>
    data?.variants.find((v) => v.tier === tier && v.enchant === enchant)?.itemId ?? data?.variants.find((v) => v.tier === tier)?.itemId;

  const draft =
    data && calc
      ? {
          itemId: data.recipe.itemId,
          itemName: `${data.recipe.nameEs} T${data.recipe.tier}${enchantLabel(data.recipe.enchant)}`,
          params: { qty, premium, blackMarket, quality, craftCity, focus, feeRate, extraCost, sellOverride, matOverrides } satisfies PlanParams,
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
              placeholder="Buscar ítem: poción, bastón, capa, montura…"
              aria-label="Buscar ítem"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {searching && <span className="shrink-0 text-xs text-muted-foreground">Buscando…</span>}
          </label>
          {query.trim().length >= 2 && !searching && hits.length === 0 && (
            <p className="absolute inset-x-0 top-full z-20 mt-1 rounded-md border border-border bg-popover px-3 py-3 text-sm text-muted-foreground">
              Sin resultados para &quot;{query.trim()}&quot;.
            </p>
          )}
          {hits.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-80 overflow-auto rounded-md border border-border bg-popover">
              {hits.map((h) => (
                <li key={h.itemId}>
                  <button
                    type="button"
                    onClick={() => load(h.itemId)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={itemIconUrl(h.itemId, 1, 64)} alt="" className="h-8 w-8" />
                    <span className="flex-1">{h.nameEs}</span>
                    <span className="text-xs text-muted-foreground">{STATION_LABEL[h.stationType] ?? h.stationType}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div role="tablist" className="flex shrink-0 rounded-md border border-border p-0.5">
          {(
            [
              ["calc", "Calculadora"],
              ["plans", `Planificaciones${plansApi.plans.length ? ` (${plansApi.plans.length})` : ""}`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
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
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      {tab === "plans" ? (
        <Panel title="Planificaciones" className="mt-4">
          <PlanList api={plansApi} onOpen={openPlan} />
        </Panel>
      ) : !data || !calc || !draft ? (
        <EmptyState loading={loading} recents={recents} onPick={load} onFocusSearch={() => searchRef.current?.focus()} />
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="space-y-4">
            {/* Item + tier/enchant */}
            <section className="rounded-md border border-border bg-card/40 p-4">
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={itemIconUrl(data.recipe.itemId, quality, 128)} alt="" className="h-16 w-16 shrink-0" />
                <div className="min-w-0">
                  <h2 className="font-heading text-2xl leading-tight">{data.recipe.nameEs}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {STATION_LABEL[data.recipe.stationType]} · lote de {data.recipe.batchSize} · foco base {fmt(data.recipe.craftingFocus)}
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
                    if (id) void load(id);
                  }}
                />
                <Segmented
                  label="Encantamiento"
                  value={data.recipe.enchant}
                  options={enchants.map((e) => ({ value: e, text: `.${e}` }))}
                  onChange={(e) => {
                    const id = variantId(data.recipe.tier, e);
                    if (id) void load(id);
                  }}
                />
              </div>
            </section>

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
                  label="Vender en"
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
              </div>

              <div className="mt-4">
                <span className="text-[11px] text-muted-foreground">Ciudad de crafteo</span>
                <div className="mt-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {REAL_CITIES.map((city) => {
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
                          "flex h-11 flex-col items-center justify-center gap-0.5 rounded-md border px-1 text-[11px] leading-none transition-colors duration-150",
                          active ? cn(theme.border, theme.bg, theme.text) : "border-border text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <CityGlyph theme={theme} />
                          <span className="truncate font-medium">{city}</span>
                        </span>
                        {bonus && <span className="font-mono text-[10px] text-money">{bonus} bono</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Cantidad a craftear">
                  <SilverInput label="Cantidad a craftear" value={qty} onChange={(v) => setQty(Math.max(1, v))} />
                </Field>
                <Field
                  label="Precio de venta (c/u)"
                  hint={
                    sellOverride !== null ? (
                      <button type="button" onClick={() => setSellOverride(null)} className="text-money underline underline-offset-2">
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
                <Field label="Tarifa de estación (por 100 nutrición)">
                  <SilverInput label="Tarifa de estación" value={feeRate} onChange={setFeeRate} />
                </Field>
                <Field label="Costos extra (total)">
                  <SilverInput label="Costos extra" value={extraCost} onChange={setExtraCost} />
                </Field>
              </div>
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
                  Retorno <span className="font-mono text-money">{(calc.rrr * 100).toFixed(1).replace(".", ",")}%</span>
                  {calc.specActive && ` · bono de ${calc.spec!.city}`}
                </>
              }
            >
              <ul className="-my-1 divide-y divide-border">
                {calc.materials.map(({ m, price, auto, cheapest, noReturn, effective }) => {
                  const edited = matOverrides[m.itemId] !== undefined;
                  return (
                    <li
                      key={m.itemId}
                      className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 py-3 sm:grid-cols-[auto_minmax(0,1fr)_9rem_6.5rem]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={itemIconUrl(m.itemId, 1, 64)} alt="" className="h-10 w-10" />
                      <div className="min-w-0">
                        <div className="truncate text-sm">{m.nameEs}</div>
                        <div className="text-[11px] text-muted-foreground">
                          <span className="font-mono">
                            {m.count} → {effective.toFixed(2).replace(".", ",")}
                          </span>
                          {noReturn ? " · sin retorno" : ""}
                          {cheapest && !edited ? ` · ${cheapest}` : ""}
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
                            className="mt-1 block text-[11px] text-money underline underline-offset-2"
                          >
                            volver a auto
                          </button>
                        )}
                        {auto === null && !edited && <span className="mt-1 block text-[11px] text-destructive">sin precio: escribilo</span>}
                      </div>
                      <div className="col-start-3 row-start-1 text-right font-mono text-sm tabular-nums sm:col-start-4">
                        {fmt(price * effective * calc.crafts)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>

          {/* Ledger */}
          <aside id="balance" className="scroll-mt-24 lg:sticky lg:top-24">
            <section className="rounded-md border-2 border-double border-money/30 bg-card/60">
              <header className="border-b border-border px-4 py-2.5">
                <h3 className="font-heading text-base">Balance</h3>
              </header>
              <div className="space-y-4 p-4 text-sm">
                <dl className="space-y-1.5">
                  <Line label={`Materiales (${calc.crafts} ${calc.crafts === 1 ? "craft" : "crafts"})`} value={fmt(calc.materialsTotal)} />
                  <Line label={`Estación (${fmt(calc.feePerCraft)} × ${calc.crafts})`} value={fmt(calc.feeTotal)} />
                  {extraCost > 0 && <Line label="Costos extra" value={fmt(extraCost)} />}
                  <Line label="Inversión" value={fmt(calc.cost)} total />
                </dl>
                <dl className="space-y-1.5">
                  <Line label={`Bruto (${fmt(calc.produced)} × ${fmt(calc.sellPrice)})`} value={fmt(calc.gross)} />
                  <Line label={`Impuestos ${(calc.taxRate * 100).toFixed(1).replace(".", ",")}%`} value={`−${fmt(calc.gross * calc.taxRate)}`} />
                  <Line label="Ingreso neto" value={fmt(calc.revenue)} total />
                </dl>

                <div className="border-t-2 border-double border-money/30 pt-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-heading text-base">Ganancia</span>
                    <span className={cn("font-mono text-2xl tabular-nums", calc.profit >= 0 ? "text-money" : "text-destructive")}>
                      {calc.profit >= 0 ? "+" : "−"}
                      {fmt(Math.abs(calc.profit))}
                    </span>
                  </div>
                  <dl className="mt-2 space-y-1 text-xs">
                    <Line label="Margen sobre inversión" value={calc.margin === null ? "--" : `${Math.round(calc.margin * 100)}%`} muted />
                    <Line label="Ganancia por unidad" value={fmt(calc.perUnit)} muted />
                    {focus && <Line label="Foco necesario (sin maestrías)" value={fmt(calc.focusTotal)} muted />}
                    <Line label="Volumen de ventas (por día)" value={fmt(calc.volume)} muted />
                    <Line
                      label="Precio de venta"
                      value={sellOverride !== null ? "editado" : `${calc.sellCities} ${calc.sellCities === 1 ? "mercado" : "mercados"}`}
                      muted
                    />
                  </dl>
                  {calc.unpriced > 0 && (
                    <p className="mt-3 text-xs text-destructive">
                      {calc.unpriced} {calc.unpriced === 1 ? "material sin precio cuenta" : "materiales sin precio cuentan"} como 0: la ganancia
                      está inflada hasta que los completes.
                    </p>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <SavePlanForm api={plansApi} draft={draft} />
                </div>
              </div>
            </section>
          </aside>

          {/* Phone: the balance is a scroll away, so its bottom line stays in reach. */}
          <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t-2 border-double border-money/30 bg-card px-4 py-2.5 lg:hidden">
            <div>
              <div className="text-[11px] text-muted-foreground">Ganancia</div>
              <div className={cn("font-mono text-lg tabular-nums", calc.profit >= 0 ? "text-money" : "text-destructive")}>
                {calc.profit >= 0 ? "+" : "−"}
                {fmt(Math.abs(calc.profit))}
              </div>
            </div>
            <a href="#balance" className="rounded-sm border border-money bg-money px-3.5 py-2 text-xs font-medium tracking-wide text-money-foreground">
              Ver balance
            </a>
          </div>
        </div>
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
        className="mt-4 rounded-sm border border-money bg-money px-4 py-2 text-sm font-medium tracking-wide text-money-foreground transition-opacity duration-150 hover:opacity-90"
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
                  <img src={itemIconUrl(r.itemId, 1, 64)} alt="" className="h-8 w-8 shrink-0" />
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
