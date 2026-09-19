"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Calculator, ChevronDown, Droplet, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatAge, formatPercent, formatSilver, enchantLabel, qualityLabel } from "./format";
import { itemIconUrl } from "@/lib/item-icons";
import { CITY_THEMES } from "@/lib/city-theme";
import type { Location } from "@/lib/aodp/cities";
import type { QualityBreakdownEntry, RecipeRow as RecipeRowData } from "@/lib/recipe-math";
import { cn } from "@/lib/utils";

const DISCARD_REASON_LABEL: Record<string, string> = {
  outlier_low: "descartado: precio anormalmente bajo (posible bait)",
  outlier_high: "descartado: precio anormalmente alto (posible troll listing)",
};

/** Screen readers otherwise get the row's raw concatenated text nodes (name, tier badge, every
 * stat) with no structure -- this gives the row/card button a clean, single accessible name. */
function rowAriaLabel(row: RecipeRowData): string {
  const { recipe } = row;
  const tier = `T${recipe.tier}${enchantLabel(recipe.enchant)}`;
  const dataNote = row.hasData ? "" : ", datos insuficientes";
  return `${recipe.nameEs}, ${tier}, ${formatSilver(row.platinumPerDay)} plata por día${dataNote}. Ver detalle.`;
}

export function RecipeRowItem({ row, rank }: { row: RecipeRowData; rank: number }) {
  return (
    <div className="border-b border-border">
      <div className="sm:hidden">
        <ContractCard row={row} />
      </div>
      <div className="hidden sm:block">
        <LedgerRow row={row} rank={rank} />
      </div>
    </div>
  );
}

/** Desktop: the original dense ledger row, unchanged -- density and inline expand stay exactly
 * as before per the Guild Ledger world's "ornament in chrome only" constraint. */
function LedgerRow({ row, rank }: { row: RecipeRowData; rank: number }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const { recipe } = row;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={detailId}
        aria-label={rowAriaLabel(row)}
        className="flex w-full items-center gap-4 px-3 py-3.5 text-left transition-colors hover:bg-accent/40"
      >
        <div className="w-8 shrink-0">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{rank}</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- external CDN, thousands of virtualized rows, next/image adds no benefit here */}
          <img src={itemIconUrl(recipe.itemId)} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" loading="lazy" />
          <span className="truncate text-sm font-medium">{recipe.nameEs}</span>
          <Badge variant="secondary" className="shrink-0 font-mono text-xs tabular-nums">
            T{recipe.tier}
            {enchantLabel(recipe.enchant)}
          </Badge>
          {!row.hasData && (
            <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
              datos insuficientes
            </Badge>
          )}
        </div>

        <div className="hidden items-center justify-end gap-4 xl:flex">
          <Stat label="costo" value={row.costPerUnit !== null ? formatSilver(row.costPerUnit) : "--"} mono />
          <Stat label="precio venta" value={row.sellRefPrice !== null ? formatSilver(row.sellRefPrice) : "--"} mono />
        </div>
        <div className="hidden w-20 shrink-0 text-right lg:block">
          <Stat
            label="ciudad bono"
            value={row.specialtyCity ?? "--"}
            className={row.specialtyCity ? CITY_THEMES[row.specialtyCity as Location]?.text : undefined}
          />
        </div>

        <div className="flex items-center justify-end gap-4 xl:gap-6">
          <Stat label="margen" value={formatPercent(row.marginPct)} mono />
          <Stat label="vol/dia" value={formatSilver(row.avgDailyVolume30d)} mono />
          <div className="w-24 text-right">
            <div className="font-mono text-lg font-semibold tabular-nums text-money">{formatSilver(row.platinumPerDay)}</div>
          </div>
        </div>
      </button>

      {open && (
        <div id={detailId}>
          <RowDetail row={row} />
        </div>
      )}
    </div>
  );
}

/** Mobile: "Registro de Contratos" -- each recipe as its own contract card instead of a dense
 * table row. Item render + name + tier center, plata/dia hero metric top-right, liquidity +
 * quality gems in the body. The whole card is the tap target for the derivation sheet -- a small
 * pergamino icon under the hero figure is the only affordance, not a full-width button. */
function ContractCard({ row }: { row: RecipeRowData }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { recipe } = row;

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label={rowAriaLabel(row)}
            className="block w-full px-3 py-3 text-left transition-colors hover:bg-accent/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- external CDN, thousands of virtualized rows, next/image adds no benefit here */}
                <img src={itemIconUrl(recipe.itemId)} alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" loading="lazy" />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium">{recipe.nameEs}</span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                      T{recipe.tier}
                      {enchantLabel(recipe.enchant)}
                    </Badge>
                    {!row.hasData && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        datos insuficientes
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end text-right">
                <div
                  className="font-mono text-xl font-semibold tabular-nums text-money"
                  style={{ textShadow: "0 0 14px color-mix(in oklch, var(--money) 55%, transparent)" }}
                >
                  {formatSilver(row.platinumPerDay)}
                </div>
                <div className="text-xs text-muted-foreground">plata/dia</div>
                <ScrollText className="mt-1 h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Droplet className="h-3 w-3" />
                <span className="font-mono tabular-nums text-foreground">{formatSilver(row.avgDailyVolume30d)}</span>
                /dia
              </div>
              {row.qualityBreakdown && <QualityGems breakdown={row.qualityBreakdown} />}
            </div>
          </button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto border-t-2 border-double">
        <SheetHeader>
          <SheetTitle className="font-heading text-base">{recipe.nameEs}</SheetTitle>
        </SheetHeader>
        <RowDetail row={row} />
      </SheetContent>
    </Sheet>
  );
}

function QualityGems({ breakdown }: { breakdown: QualityBreakdownEntry[] }) {
  return (
    <div className="flex items-center gap-1">
      {breakdown.map((q) => {
        const label = `${qualityLabel(q.quality)}${q.liquid ? "" : " -- sin liquidez, no cuenta"}`;
        return (
          <span
            key={q.quality}
            role="img"
            aria-label={label}
            title={label}
            className={cn("h-2 w-2 rotate-45", q.liquid && q.price !== null ? "bg-money" : "bg-muted-foreground/30")}
          />
        );
      })}
    </div>
  );
}

function Stat({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className="text-right">
      <div className={cn("text-xs text-foreground", mono && "font-mono tabular-nums", className)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function specialtyLabel(row: RecipeRowData): string {
  const focusLabel = row.focus ? "con foco" : "sin foco";
  if (!row.specialtyCity) return `sin especialidad para esta categoría, ${focusLabel}`;
  const activeLabel = row.specialtyActive ? `con especialidad (${row.specialtyCity})` : `sin especialidad (sería ${row.specialtyCity})`;
  return `${activeLabel}, ${focusLabel}`;
}

function RowDetail({ row }: { row: RecipeRowData }) {
  return (
    <div className="bg-card/50 px-3 py-3 text-xs sm:px-9">
      <Link
        href={`/es/calculadora?item=${encodeURIComponent(row.recipe.itemId)}`}
        className="mb-3 inline-flex items-center gap-1.5 rounded-sm border border-money/50 bg-money/10 px-2.5 py-1 font-medium text-money transition-colors hover:bg-money/20"
      >
        <Calculator className="h-3.5 w-3.5" />
        Abrir en la calculadora
      </Link>
      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <h4 className="mb-1.5 font-medium text-foreground">Venta</h4>
          <dl className="space-y-1 text-muted-foreground">
            <Row k="Precio de referencia" v={row.sellRefPrice !== null ? `${formatSilver(row.sellRefPrice)} plata` : "sin datos"} />
            <Row k="Mediana entre" v={`${row.sellRefCitiesCount} ciudades`} />
            <Row k="Dato más viejo usado" v={formatAge(row.sellRefAgeSeconds)} />
            <Row k="Retorno asumido" v={`${Math.round(row.returnRatePct * 100)}% (${specialtyLabel(row)})`} />
            <Row k="Item Value (materiales, lote)" v={formatSilver(Number(row.recipe.materialItemValue))} />
            <Row k="Fee de estación (lote)" v={`${formatSilver(row.feePerBatch)} plata`} />
            <Row k="Cuota de mercado" v={`${Math.round(row.marketSharePct * 100)}%`} />
          </dl>
          {row.qualityBreakdown && (
            <div className="mt-2">
              <h5 className="mb-1 font-medium text-foreground">Por calidad</h5>
              <ul className="space-y-0.5">
                {row.qualityBreakdown.map((q) => (
                  <li
                    key={q.quality}
                    className={cn("flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5", !q.liquid && "opacity-70")}
                  >
                    <span>{qualityLabel(q.quality)}</span>
                    <span
                      className={cn(
                        "ml-auto shrink-0 font-mono tabular-nums text-foreground",
                        !q.liquid && "underline decoration-dashed decoration-muted-foreground underline-offset-4",
                      )}
                    >
                      {q.price !== null ? `${formatSilver(q.price)} plata` : "sin dato"}
                      {!q.liquid && " -- sin liquidez, no cuenta"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {row.discarded.length > 0 && (
            <div className="mt-2">
              <h5 className="mb-1 font-medium text-foreground">Descartado</h5>
              <ul className="space-y-0.5">
                {row.discarded.map((d, i) => (
                  <li key={i} className="text-muted-foreground">
                    <span className={CITY_THEMES[d.city as Location]?.text}>{d.city}</span>: {formatSilver(d.price)} --{" "}
                    {DISCARD_REASON_LABEL[d.reason] ?? d.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section>
          <h4 className="mb-1.5 font-medium text-foreground">Materiales (lote de {row.recipe.batchSize})</h4>
          <dl className="space-y-1 text-muted-foreground">
            {row.materials.map((m) => (
              <Row
                key={m.itemId}
                k={`${m.nameEs} x${m.count}`}
                v={
                  m.buyRefPrice !== null
                    ? `${formatSilver(m.buyRefPrice)} c/u -> ${formatSilver(m.costContribution)}`
                    : "sin dato de precio"
                }
              />
            ))}
          </dl>
          <Separator className="my-2" />
          <dl className="space-y-1 text-muted-foreground">
            <Row k="Costo por unidad" v={row.costPerUnit !== null ? `${formatSilver(row.costPerUnit)} plata` : "--"} />
            <Row
              k="Ingreso neto por unidad"
              v={row.revenuePerUnitNet !== null ? `${formatSilver(row.revenuePerUnitNet)} plata` : "--"}
            />
            <Row k="Ganancia por unidad" v={row.profitPerUnit !== null ? `${formatSilver(row.profitPerUnit)} plata` : "--"} />
          </dl>
        </section>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt>{k}</dt>
      <dd className="ml-auto shrink-0 font-mono tabular-nums text-foreground">{v}</dd>
    </div>
  );
}
