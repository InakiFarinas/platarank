"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { enchantLabel, formatAge, qualityLabel } from "@/components/recipes/format";
import { BLACK_MARKET, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { getCitySpecialty } from "@/lib/city-specialties";
import { itemIconUrl } from "@/lib/item-icons";
import { robustStat, type CityQuote } from "@/lib/formulas/outliers";
import { craftingFeePerBatch } from "@/lib/formulas/station-fee";
import { returnRate } from "@/lib/formulas/return-rate";
import type { CityPricePoint } from "@/lib/recipe-math";
import type { Recipe } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { PlansPanel, type PlanParams } from "@/components/calculator/plans-panel";

type Hit = { itemId: string; baseItemId: string; nameEs: string; tier: number; stationType: string };
type Variant = { itemId: string; tier: number; enchant: number };
type ItemData = { recipe: Recipe; market: Record<string, CityPricePoint[]>; variants: Variant[] };

const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");
const SETUP_FEE = 0.025;

export function Calculator() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [data, setData] = useState<ItemData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("item");
    if (id) void load(id);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/calculator/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) setHits(await res.json());
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  async function load(id: string): Promise<boolean> {
    setError(null);
    const res = await fetch(`/api/calculator/item?id=${encodeURIComponent(id)}`);
    if (!res.ok) {
      setError("No se encontró ese ítem.");
      return false;
    }
    setData(await res.json());
    setQuality(1);
    setSellOverride(null);
    setMatOverrides({});
    setHits([]);
    setQuery("");
    window.history.replaceState(null, "", `?item=${encodeURIComponent(id)}`);
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
      const matRrr = m.category === "artifact" ? 0 : rrr;
      return { m, price, auto: stat.value, cheapest, effective: m.count * (1 - matRrr) };
    });

    const sellPoints = (market[recipe.itemId] ?? []).filter(
      (p) => p.quality === quality && p.price !== null && (blackMarket ? p.city === BLACK_MARKET : p.city !== BLACK_MARKET),
    );
    const sellStat = robustStat(sellPoints.map((p) => ({ city: p.city, price: p.price! })), "median");
    const sellPrice = sellOverride ?? sellStat.value ?? 0;
    const ages = sellPoints.map((p) => p.priceAgeSeconds).filter((a): a is number => a !== null);
    const volume = sellPoints.reduce((s, p) => s + p.avgDailyVolume30d, 0);

    const crafts = Math.ceil(qty / recipe.batchSize);
    const feePerCraft = craftingFeePerBatch(Number(recipe.materialItemValue), feeRate);
    const materialsTotal = materials.reduce((s, x) => s + x.price * x.effective, 0) * crafts;
    const feeTotal = feePerCraft * crafts;
    const cost = materialsTotal + feeTotal + extraCost;
    const taxRate = (premium ? 0.04 : 0.08) + SETUP_FEE;
    const produced = crafts * recipe.batchSize;
    const revenue = sellPrice * produced * (1 - taxRate);
    const profit = revenue - cost;

    return {
      spec,
      specActive,
      rrr,
      materials,
      sellPrice,
      sellAuto: sellStat.value,
      oldestAge: ages.length ? Math.max(...ages) : null,
      volume,
      crafts,
      produced,
      feePerCraft,
      materialsTotal,
      feeTotal,
      cost,
      taxRate,
      revenue,
      profit,
      margin: cost > 0 ? profit / cost : null,
      focusTotal: focus ? recipe.craftingFocus * crafts : 0,
    };
  }, [data, qty, premium, blackMarket, quality, craftCity, focus, feeRate, extraCost, sellOverride, matOverrides]);

  const tiers = data ? [...new Set(data.variants.map((v) => v.tier))].sort((a, b) => a - b) : [];
  const enchants = data
    ? data.variants.filter((v) => v.tier === data.recipe.tier).map((v) => v.enchant).sort((a, b) => a - b)
    : [];
  const variantId = (tier: number, enchant: number) =>
    data?.variants.find((v) => v.tier === tier && v.enchant === enchant)?.itemId ??
    data?.variants.find((v) => v.tier === tier)?.itemId;

  return (
    <div className="mt-2 space-y-4">
      <section className="relative rounded-md border border-border bg-card/40 p-4">
        <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ítem (ej. poción, bastón, capa...)"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        {hits.length > 0 && (
          <ul className="absolute inset-x-4 top-[calc(100%-0.5rem)] z-20 max-h-72 overflow-auto rounded-md border border-border bg-popover">
            {hits.map((h) => (
              <li key={h.itemId}>
                <button
                  type="button"
                  onClick={() => load(h.itemId)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={itemIconUrl(h.itemId, 1, 64)} alt="" className="h-8 w-8" />
                  <span className="flex-1">{h.nameEs}</span>
                  <span className="font-mono text-xs text-muted-foreground">T{h.tier}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </section>

      {!data || !calc ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Elegí un ítem para calcular su rentabilidad.</p>
      ) : (
        <>
          <section className="rounded-md border border-border bg-card/40 p-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={itemIconUrl(data.recipe.itemId, quality, 96)} alt="" className="h-14 w-14" />
              <div>
                <h2 className="font-display text-lg uppercase tracking-tight">
                  {data.recipe.nameEs}{" "}
                  <span className="text-money">
                    T{data.recipe.tier}
                    {enchantLabel(data.recipe.enchant)}
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Lote de {data.recipe.batchSize} · foco {data.recipe.craftingFocus} por craft
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Chips
                label="Tier"
                items={tiers.map((t) => ({ key: t, text: `T${t}`, active: t === data.recipe.tier }))}
                onPick={(t) => {
                  const id = variantId(t, data.recipe.enchant);
                  if (id) void load(id);
                }}
              />
              <Chips
                label="Encantamiento"
                items={enchants.map((e) => ({ key: e, text: `.${e}`, active: e === data.recipe.enchant }))}
                onPick={(e) => {
                  const id = variantId(data.recipe.tier, e);
                  if (id) void load(id);
                }}
              />
            </div>
          </section>

          <section className="rounded-md border border-border bg-card/40 p-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <Toggle label={premium ? "Con premium" : "Sin premium"} checked={premium} onChange={setPremium} />
              <Toggle label={blackMarket ? "Black Market" : "Royal Market"} checked={blackMarket} onChange={setBlackMarket} />
              <Toggle label={focus ? "Con foco" : "Sin foco"} checked={focus} onChange={setFocus} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <NumField label="Cantidad" value={qty} min={1} onChange={(v) => setQty(Math.max(1, v))} />
              <NumField
                label={`Precio de venta${calc.sellAuto === null && sellOverride === null ? " (sin dato)" : ""}`}
                value={Math.round(calc.sellPrice)}
                onChange={(v) => setSellOverride(v)}
                hint={sellOverride !== null ? "editado" : calc.oldestAge !== null ? formatAge(calc.oldestAge) : undefined}
                onReset={sellOverride !== null ? () => setSellOverride(null) : undefined}
              />
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Ciudad de crafteo</span>
                <select
                  value={craftCity}
                  onChange={(e) => setCraftCity(e.target.value as Location)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                >
                  {REAL_CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              {data.recipe.stationType === "gear" && (
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Calidad</span>
                  <select
                    value={quality}
                    onChange={(e) => {
                      setQuality(Number(e.target.value));
                      setSellOverride(null);
                    }}
                    className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((q) => (
                      <option key={q} value={q}>
                        {qualityLabel(q)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <NumField label="Tarifa de estación (por 100 nutrición)" value={feeRate} min={0} onChange={setFeeRate} />
              <NumField label="Costos extra (total)" value={extraCost} min={0} onChange={setExtraCost} />
            </div>
          </section>

          <section className="rounded-md border border-border bg-card/40 p-4">
            <div className="flex items-baseline justify-between">
              <h3 className="font-heading text-base">Materiales</h3>
              <span className="text-xs text-muted-foreground">
                Retorno <span className="font-mono text-money">{(calc.rrr * 100).toFixed(1)}%</span>
                {calc.specActive && ` · bono de ${calc.spec!.city}`}
              </span>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {calc.materials.map(({ m, price, auto, cheapest, effective }) => (
                <li key={m.itemId} className="flex flex-wrap items-center gap-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={itemIconUrl(m.itemId, 1, 64)} alt="" className="h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{m.nameEs}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {m.count} base → {effective.toFixed(2)} netos {cheapest && `· más barato en ${cheapest}`}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={Math.round(price)}
                    onChange={(e) => setMatOverrides((o) => ({ ...o, [m.itemId]: Math.max(0, Number(e.target.value) || 0) }))}
                    aria-label={`Precio de ${m.nameEs}`}
                    className={cn(
                      "h-9 w-28 rounded-md border bg-background px-2 text-right font-mono text-sm tabular-nums",
                      matOverrides[m.itemId] !== undefined ? "border-money/60" : "border-border",
                      auto === null && matOverrides[m.itemId] === undefined && "border-destructive/60",
                    )}
                  />
                  <span className="w-24 text-right font-mono text-sm tabular-nums text-muted-foreground">
                    {fmt(price * effective * calc.crafts)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border bg-card/40 p-4">
              <h3 className="font-heading text-base">Resumen de compras</h3>
              <dl className="mt-3 space-y-1.5 text-sm">
                <Row label={`Materiales (×${calc.crafts} crafts)`} value={fmt(calc.materialsTotal)} />
                <Row label={`Tarifa de estación (${fmt(calc.feePerCraft)} × ${calc.crafts})`} value={fmt(calc.feeTotal)} />
                {extraCost > 0 && <Row label="Costos extra" value={fmt(extraCost)} />}
                <Row label="Inversión total" value={fmt(calc.cost)} strong />
                {focus && <Row label="Foco necesario (sin maestrías)" value={fmt(calc.focusTotal)} />}
              </dl>
            </div>
            <div className="rounded-md border border-border bg-card/40 p-4">
              <h3 className="font-heading text-base">Resumen de ventas</h3>
              <dl className="mt-3 space-y-1.5 text-sm">
                <Row label={`Bruto (${calc.produced} × ${fmt(calc.sellPrice)})`} value={fmt(calc.sellPrice * calc.produced)} />
                <Row label={`Impuestos (${(calc.taxRate * 100).toFixed(1)}%)`} value={`-${fmt(calc.sellPrice * calc.produced * calc.taxRate)}`} />
                <Row label="Ingreso neto" value={fmt(calc.revenue)} strong />
                <Row label="Ganancia" value={fmt(calc.profit)} tone={calc.profit >= 0 ? "money" : "loss"} strong />
                <Row label="Margen" value={calc.margin === null ? "--" : `${Math.round(calc.margin * 100)}%`} />
                <Row label="Volumen diario del mercado" value={fmt(calc.volume)} />
              </dl>
            </div>
          </section>
        </>
      )}

      <PlansPanel
        onOpen={openPlan}
        current={
          data && calc
            ? {
                itemId: data.recipe.itemId,
                itemName: `${data.recipe.nameEs} T${data.recipe.tier}${enchantLabel(data.recipe.enchant)}`,
                params: { qty, premium, blackMarket, quality, craftCity, focus, feeRate, extraCost, sellOverride, matOverrides },
                snapshot: { cost: calc.cost, revenue: calc.revenue, profit: calc.profit, sellPrice: calc.sellPrice },
              }
            : null
        }
      />
    </div>
  );
}

function Chips({
  label,
  items,
  onPick,
}: {
  label: string;
  items: { key: number; text: string; active: boolean }[];
  onPick: (k: number) => void;
}) {
  return (
    <div>
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((i) => (
          <button
            key={i.key}
            type="button"
            onClick={() => onPick(i.key)}
            className={cn(
              "rounded-sm border px-3 py-1 font-mono text-xs transition-colors",
              i.active ? "border-money bg-money/15 text-money" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {i.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
      <Switch checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  hint,
  onReset,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  hint?: string;
  onReset?: () => void;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
        {hint && (
          <span className="normal-case">
            {hint}
            {onReset && (
              <button type="button" onClick={onReset} className="ml-1.5 text-money underline underline-offset-2">
                auto
              </button>
            )}
          </span>
        )}
      </span>
      <input
        type="number"
        min={min ?? 0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 h-9 w-full rounded-md border border-border bg-background px-2 text-right font-mono text-sm tabular-nums"
      />
    </label>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "money" | "loss" }) {
  return (
    <div className={cn("flex justify-between gap-3", strong && "border-t border-border pt-1.5 font-medium")}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-mono tabular-nums", tone === "money" && "text-money", tone === "loss" && "text-destructive")}>{value}</dd>
    </div>
  );
}
