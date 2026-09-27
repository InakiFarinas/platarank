"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown } from "lucide-react";
import { RecipeRowItem } from "./recipe-row";
import { SORT_ACCESSORS, type RecipeRow, type SortKey } from "@/lib/recipe-math";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

export function RecipeTable({
  rows,
  isFiltered,
  onClearFilters,
  sortKey,
  desc,
  onSortChange,
  className,
}: {
  rows: RecipeRow[];
  /** Whether the empty `rows` is because a search/filter narrowed it there, as opposed to this
   * rubro genuinely having no data yet -- the two need different messages, since "volvé a mirar en
   * un rato" is actively misleading for a search typo (see /impeccable critique 2026-09-18). */
  isFiltered: boolean;
  onClearFilters: () => void;
  /** Sort state lives in the parent (not here) so a remote station can re-rank server-side instead
   * of just re-sorting whatever slice already arrived -- see the P0 note on `rankStation`. */
  sortKey: SortKey;
  desc: boolean;
  onSortChange: (key: SortKey) => void;
  className?: string;
}) {
  const t = useTranslations("rankingUi.table");
  const [page, setPage] = useState(0);

  // `rows` already arrives sorted by `sortKey` for a remote station (the server ranked it); for a
  // local station it doesn't, so this re-sort is a no-op there and the only sort there for here.
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

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {isFiltered ? (
          <>
            <p>{t("noMatches")}</p>
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-2 text-money underline underline-offset-2 hover:text-money/80"
            >
              {t("clearFilters")}
            </button>
          </>
        ) : (
          <p>{t("noRecipes")}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("mb-20 flex flex-col rounded-md border border-border lg:mb-0 lg:min-h-0 lg:flex-1", className)}>
      <div className="flex items-center gap-2 overflow-x-auto border-b-2 border-double border-border px-3 py-2 sm:hidden">
        <span className="shrink-0 text-xs text-muted-foreground">{t("sortBy")}</span>
        <MobileSortChip active={sortKey === "platinumPerDay"} desc={desc} onClick={() => onSortChange("platinumPerDay")} label={t("platinumPerDay")} />
        <MobileSortChip active={sortKey === "margin"} desc={desc} onClick={() => onSortChange("margin")} label={t("margin")} />
        <MobileSortChip active={sortKey === "volume"} desc={desc} onClick={() => onSortChange("volume")} label={t("volume")} />
      </div>

      <div className="hidden items-center gap-4 border-b-2 border-double border-border px-3 py-2 text-xs text-muted-foreground sm:flex">
        <span className="w-8 shrink-0">#</span>
        <span className="flex-1">{t("item")}</span>
        <div className="hidden items-center gap-4 xl:flex">
          <SortHeader active={sortKey === "cost"} desc={desc} onClick={() => onSortChange("cost")} label={t("cost")} width="w-14" />
          <SortHeader active={sortKey === "sellPrice"} desc={desc} onClick={() => onSortChange("sellPrice")} label={t("sellPrice")} width="w-20" />
        </div>
        <span className="hidden w-20 shrink-0 lg:block">{t("bonusCity")}</span>
        <div className="flex items-center gap-4 xl:gap-6">
          <SortHeader active={sortKey === "margin"} desc={desc} onClick={() => onSortChange("margin")} label={t("margin")} width="w-12" />
          <SortHeader active={sortKey === "volume"} desc={desc} onClick={() => onSortChange("volume")} label={t("volPerDay")} width="w-12" />
          <SortHeader
            active={sortKey === "platinumPerDay"}
            desc={desc}
            onClick={() => onSortChange("platinumPerDay")}
            label={t("platinumPerDay")}
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
          {t.rich("page", {
            current: currentPage + 1,
            total: pageCount,
            n: (chunks) => <span className="font-mono tabular-nums text-foreground">{chunks}</span>,
          })}
        </span>
        <div className="flex items-center gap-1.5">
          <PageButton onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} label={t("prevPage")}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </PageButton>
          <PageButton
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={currentPage >= pageCount - 1}
            label={t("nextPage")}
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
  const t = useTranslations("rankingUi.table");
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
      {active && <span className="sr-only">{desc ? t("sortDesc") : t("sortAsc")}</span>}
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
  const t = useTranslations("rankingUi.table");
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
      {active && <span className="sr-only">{desc ? t("sortDesc") : t("sortAsc")}</span>}
    </button>
  );
}
