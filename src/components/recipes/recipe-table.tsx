"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown } from "lucide-react";
import { RecipeRowItem } from "./recipe-row";
import type { RecipeRow } from "@/lib/recipe-math";
import { cn } from "@/lib/utils";

type SortKey = "margin" | "volume" | "cost" | "sellPrice" | "platinumPerDay";

const SORT_ACCESSORS: Record<SortKey, (r: RecipeRow) => number> = {
  margin: (r) => r.marginPct ?? -Infinity,
  volume: (r) => r.avgDailyVolume30d,
  cost: (r) => r.costPerUnit ?? -Infinity,
  sellPrice: (r) => r.sellRefPrice ?? -Infinity,
  platinumPerDay: (r) => r.platinumPerDay ?? -Infinity,
};

const PAGE_SIZE = 10;

export function RecipeTable({
  rows,
  isFiltered,
  onClearFilters,
  className,
}: {
  rows: RecipeRow[];
  /** Whether the empty `rows` is because a search/filter narrowed it there, as opposed to this
   * rubro genuinely having no data yet -- the two need different messages, since "volvé a mirar en
   * un rato" is actively misleading for a search typo (see /impeccable critique 2026-09-18). */
  isFiltered: boolean;
  onClearFilters: () => void;
  className?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("platinumPerDay");
  const [desc, setDesc] = useState(true);
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => {
    const accessor = SORT_ACCESSORS[sortKey];
    return [...rows].sort((a, b) => (desc ? accessor(b) - accessor(a) : accessor(a) - accessor(b)));
  }, [rows, sortKey, desc]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);

  // Sorting or a filter change can shrink the list out from under the current page (or reorder
  // it entirely) -- always land back on page 1 rather than showing an empty or stale page.
  useEffect(() => {
    setPage(0);
  }, [rows, sortKey, desc]);

  const pageRows = sortedRows.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setDesc((d) => !d);
    else {
      setSortKey(key);
      setDesc(true);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {isFiltered ? (
          <>
            <p>No hay recetas que coincidan con la búsqueda o los filtros actuales.</p>
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-2 text-money underline underline-offset-2 hover:text-money/80"
            >
              Quitar búsqueda y filtros
            </button>
          </>
        ) : (
          <p>Todavía no hay recetas cargadas. El ingester corre por hora -- volvé a mirar en un rato.</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("mb-20 flex flex-col rounded-md border border-border lg:mb-0 lg:min-h-0 lg:flex-1", className)}>
      <div className="flex items-center gap-2 overflow-x-auto border-b-2 border-double border-border px-3 py-2 sm:hidden">
        <span className="shrink-0 text-xs text-muted-foreground">Ordenar:</span>
        <MobileSortChip active={sortKey === "platinumPerDay"} desc={desc} onClick={() => toggleSort("platinumPerDay")} label="Plata/dia" />
        <MobileSortChip active={sortKey === "margin"} desc={desc} onClick={() => toggleSort("margin")} label="Margen" />
        <MobileSortChip active={sortKey === "volume"} desc={desc} onClick={() => toggleSort("volume")} label="Volumen" />
      </div>

      <div className="hidden items-center gap-4 border-b-2 border-double border-border px-3 py-2 text-xs text-muted-foreground sm:flex">
        <span className="w-8 shrink-0">#</span>
        <span className="flex-1">Ítem</span>
        <div className="hidden items-center gap-4 xl:flex">
          <SortHeader active={sortKey === "cost"} desc={desc} onClick={() => toggleSort("cost")} label="Costo" width="w-14" />
          <SortHeader active={sortKey === "sellPrice"} desc={desc} onClick={() => toggleSort("sellPrice")} label="Precio venta" width="w-20" />
        </div>
        <span className="hidden w-20 shrink-0 lg:block">Ciudad bono</span>
        <div className="flex items-center gap-4 xl:gap-6">
          <SortHeader active={sortKey === "margin"} desc={desc} onClick={() => toggleSort("margin")} label="Margen" width="w-12" />
          <SortHeader active={sortKey === "volume"} desc={desc} onClick={() => toggleSort("volume")} label="Vol/dia" width="w-12" />
          <SortHeader
            active={sortKey === "platinumPerDay"}
            desc={desc}
            onClick={() => toggleSort("platinumPerDay")}
            label="Plata/dia"
            width="w-24"
          />
        </div>
      </div>

      <div className="lg:flex-1">
        {pageRows.map((row, i) => (
          <RecipeRowItem key={row.recipe.itemId} row={row} rank={currentPage * PAGE_SIZE + i + 1} />
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-double border-border px-3 py-2.5 text-xs text-muted-foreground">
        <span>
          Página <span className="font-mono tabular-nums text-foreground">{currentPage + 1}</span> de{" "}
          <span className="font-mono tabular-nums text-foreground">{pageCount}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <PageButton onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} label="Página anterior">
            <ArrowLeft className="h-3.5 w-3.5" />
          </PageButton>
          <PageButton
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
            label="Página siguiente"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </PageButton>
        </div>
      </div>
    </div>
  );
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-foreground transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:border-money/40 hover:text-money disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function MobileSortChip({
  active,
  desc,
  onClick,
  label,
}: {
  active: boolean;
  desc: boolean;
  onClick: () => void;
  label: string;
}) {
  const Icon = active ? (desc ? ArrowDown : ArrowUp) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs transition-colors after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-['']",
        active ? "border-money/50 bg-money/10 text-money" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
      {active && <span className="sr-only">, orden {desc ? "descendente" : "ascendente"}</span>}
    </button>
  );
}

function SortHeader({
  active,
  desc,
  onClick,
  label,
  width,
  left,
}: {
  active: boolean;
  desc: boolean;
  onClick: () => void;
  label: string;
  width: string;
  left?: boolean;
}) {
  const Icon = active ? (desc ? ArrowDown : ArrowUp) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1 transition-colors hover:text-foreground",
        left ? "justify-start" : "justify-end",
        width,
        active && "text-money",
      )}
    >
      {left && <Icon className="h-3 w-3" />}
      {label}
      {!left && <Icon className="h-3 w-3" />}
      {active && <span className="sr-only">, orden {desc ? "descendente" : "ascendente"}</span>}
    </button>
  );
}
