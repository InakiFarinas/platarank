"use client";

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { RecipeRowItem } from "./recipe-row";
import type { RecipeRow } from "@/lib/recipe-math";
import { cn } from "@/lib/utils";

type SortKey = "margin" | "volume" | "platinumPerDay";

const SORT_ACCESSORS: Record<SortKey, (r: RecipeRow) => number> = {
  margin: (r) => r.marginPct ?? -Infinity,
  volume: (r) => r.avgDailyVolume30d,
  platinumPerDay: (r) => r.platinumPerDay ?? -Infinity,
};

export function RecipeTable({ rows }: { rows: RecipeRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("platinumPerDay");
  const [desc, setDesc] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sortedRows = useMemo(() => {
    const accessor = SORT_ACCESSORS[sortKey];
    return [...rows].sort((a, b) => (desc ? accessor(b) - accessor(a) : accessor(a) - accessor(b)));
  }, [rows, sortKey, desc]);

  const virtualizer = useVirtualizer({
    count: sortedRows.length,
    getScrollElement: () => scrollRef.current,
    // Mobile renders a taller contract card, desktop the old 52px dense row; measureElement
    // corrects the real size right after mount, so this constant only has to avoid a big jump --
    // it must NOT depend on window/viewport, or the SSR guess (always 52) would mismatch the
    // client's first render and trip a hydration error on the sizer's inline height style.
    estimateSize: () => 96,
    overscan: 12,
  });

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
        Todavía no hay recetas cargadas. El ingester corre por hora -- volvé a mirar en un rato.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <div className="flex items-center gap-2 overflow-x-auto border-b-2 border-double border-border px-3 py-2 sm:hidden">
        <span className="shrink-0 text-[11px] text-muted-foreground">Ordenar:</span>
        <MobileSortChip active={sortKey === "platinumPerDay"} desc={desc} onClick={() => toggleSort("platinumPerDay")} label="Plata/dia" />
        <MobileSortChip active={sortKey === "margin"} desc={desc} onClick={() => toggleSort("margin")} label="Margen" />
        <MobileSortChip active={sortKey === "volume"} desc={desc} onClick={() => toggleSort("volume")} label="Volumen" />
      </div>

      <div className="hidden items-center gap-4 border-b-2 border-double border-border px-3 py-2 text-[11px] text-muted-foreground sm:flex">
        <span className="w-8 shrink-0">#</span>
        <span className="flex-1">Ítem</span>
        <div className="flex items-center gap-6">
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

      <div ref={scrollRef} className="max-h-[70vh] overflow-y-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = sortedRows[virtualRow.index];
            return (
              <div
                key={row.recipe.itemId}
                ref={virtualizer.measureElement}
                data-index={virtualRow.index}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${virtualRow.start}px)` }}
              >
                <RecipeRowItem row={row} rank={virtualRow.index + 1} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
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
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs transition-colors",
        active ? "border-money/50 bg-money/10 text-money" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
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
    </button>
  );
}
