"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QualityBadge } from "./quality-badge";
import { formatAge, formatPercent, formatSilver, enchantLabel } from "./format";
import type { RecipeRow as RecipeRowData } from "@/lib/recipe-math";
import { cn } from "@/lib/utils";

const DISCARD_REASON_LABEL: Record<string, string> = {
  outlier_low: "descartado: precio anormalmente bajo (posible bait)",
  outlier_high: "descartado: precio anormalmente alto (posible troll listing)",
};

export function RecipeRowItem({ row, rank }: { row: RecipeRowData; rank: number }) {
  const [open, setOpen] = useState(false);
  const { recipe } = row;

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:gap-4 sm:py-2"
      >
        <div className="flex items-center gap-2 sm:w-8 sm:shrink-0">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{rank}</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
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

        <div className="flex items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-6">
          <Stat label="margen" value={formatPercent(row.marginPct)} mono />
          <Stat label="vol/dia" value={formatSilver(row.avgDailyVolume30d)} mono />
          <QualityBadge
            score={row.qualityScore}
            citiesQuoted={row.sellRefCitiesCount}
            brecilienCovered={row.brecilienCovered}
          />
          <div className="w-20 text-right sm:w-24">
            <div className="font-mono text-base font-semibold tabular-nums text-money sm:text-lg">
              {formatSilver(row.platinumPerDay)}
            </div>
            <div className="text-[11px] text-muted-foreground sm:hidden">plata/dia</div>
          </div>
        </div>
      </button>

      {open && <RowDetail row={row} />}
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
  if (row.recipe.stationType === "alchemy") return `Brecilien, ${focusLabel}`;
  if (row.recipe.stationType === "refining") {
    return `${row.specialtyActive ? "con" : "sin"} especialidad de refinado, ${focusLabel}`;
  }
  return focusLabel;
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
            <Row k="Score de calidad" v={`${row.qualityScore}/100`} />
            <Row k="Retorno asumido" v={`${Math.round(row.returnRatePct * 100)}% (${specialtyLabel(row)})`} />
            <Row k="Fee de estación (lote)" v={`${formatSilver(row.feePerBatch)} plata`} />
            <Row k="Cuota de mercado" v={`${Math.round(row.marketSharePct * 100)}%`} />
          </dl>
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
    <div className="flex items-baseline justify-between gap-3">
      <dt className="truncate">{k}</dt>
      <dd className="shrink-0 font-mono tabular-nums text-foreground">{v}</dd>
    </div>
  );
}
