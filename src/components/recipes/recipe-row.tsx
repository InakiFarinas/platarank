"use client";

import { useState } from "react";
import { ChevronDown, Droplet, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatAge, formatPercent, formatSilver, enchantLabel, qualityLabel } from "./format";
import { itemIconUrl } from "@/lib/item-icons";
import type { QualityBreakdownEntry, RecipeRow as RecipeRowData } from "@/lib/recipe-math";
import { cn } from "@/lib/utils";

const DISCARD_REASON_LABEL: Record<string, string> = {
  outlier_low: "descartado: precio anormalmente bajo (posible bait)",
  outlier_high: "descartado: precio anormalmente alto (posible troll listing)",
};

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
  const { recipe } = row;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-3 py-2 text-left transition-colors hover:bg-accent/40"
      >
        <div className="w-8 shrink-0">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{rank}</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
          <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-secondary/60">
            {/* eslint-disable-next-line @next/next/no-img-element -- external CDN, thousands of virtualized rows, next/image adds no benefit here */}
            <img src={itemIconUrl(recipe.itemId)} alt="" className="h-5 w-5 object-contain" loading="lazy" />
          </div>
          <span className="truncate text-sm font-medium">{recipe.nameEs}</span>
          <Badge variant="secondary" className="shrink-0 font-mono text-[11px] tabular-nums">
            T{recipe.tier}
            {enchantLabel(recipe.enchant)}
          </Badge>
          {!row.hasData && (
            <Badge variant="outline" className="shrink-0 text-[11px] text-muted-foreground">
              datos insuficientes
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-end gap-6">
          <Stat label="margen" value={formatPercent(row.marginPct)} mono />
          <Stat label="vol/dia" value={formatSilver(row.avgDailyVolume30d)} mono />
          <div className="w-24 text-right">
            <div className="font-mono text-lg font-semibold tabular-nums text-money">{formatSilver(row.platinumPerDay)}</div>
          </div>
        </div>
      </button>

      {open && <RowDetail row={row} />}
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
          <button type="button" className="block w-full px-3 py-3 text-left transition-colors hover:bg-accent/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary/60">
                  {/* eslint-disable-next-line @next/next/no-img-element -- external CDN, thousands of virtualized rows, next/image adds no benefit here */}
                  <img src={itemIconUrl(recipe.itemId)} alt="" className="h-8 w-8 object-contain" loading="lazy" />
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium">{recipe.nameEs}</span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Badge variant="secondary" className="font-mono text-[11px] tabular-nums">
                      T{recipe.tier}
                      {enchantLabel(recipe.enchant)}
                    </Badge>
                    {!row.hasData && (
                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
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
                <div className="text-[11px] text-muted-foreground">plata/dia</div>
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
      {breakdown.map((q) => (
        <span
          key={q.quality}
          title={`${qualityLabel(q.quality)}${q.liquid ? "" : " -- sin liquidez, no cuenta"}`}
          className={cn("h-2 w-2 rotate-45", q.liquid && q.price !== null ? "bg-money" : "bg-muted-foreground/30")}
        />
      ))}
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="text-right">
      <div className={cn("text-xs text-foreground", mono && "font-mono tabular-nums")}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
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
      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <h4 className="mb-1.5 font-medium text-foreground">Venta</h4>
          <dl className="space-y-1 text-muted-foreground">
            <Row k="Precio de referencia" v={row.sellRefPrice !== null ? `${formatSilver(row.sellRefPrice)} plata` : "sin datos"} />
            <Row k="Mediana entre" v={`${row.sellRefCitiesCount} ciudades`} />
            <Row k="Dato más viejo usado" v={formatAge(row.sellRefAgeSeconds)} />
            <Row
              k="Brecilien"
              v={row.brecilienCovered ? "cotiza este ítem" : "sin cotización para este ítem"}
            />
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
                  <li key={q.quality} className={cn("flex items-baseline justify-between gap-3", !q.liquid && "opacity-70")}>
                    <span className="truncate">
                      {qualityLabel(q.quality)} ({Math.round(q.weight * 100)}%)
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono tabular-nums text-foreground",
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
                    {d.city}: {formatSilver(d.price)} -- {DISCARD_REASON_LABEL[d.reason] ?? d.reason}
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
