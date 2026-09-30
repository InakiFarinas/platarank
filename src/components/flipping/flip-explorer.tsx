"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { FlipTable } from "./flip-table";
import { FlipControls, FlipFiltersPanel, NameSearchField } from "./flip-controls";
import { SiteHeader } from "@/components/site-header";
import { DEFAULT_FLIP_PARAMS, type FlipParams, type FlipRow, type FlipSortKey } from "@/lib/flip-math";
import { applyFlipFilters, DEFAULT_FLIP_FILTERS, type FlipFilterParams } from "@/lib/flip-filters";
import { parseStateFromUrl, writeStateToUrl } from "./url-state";

export function FlipExplorer({
  initialRows,
  totalCount,
  title,
  description,
}: {
  /** The hourly snapshot, already ranked by the default params/filters/sort -- reused until the
   * player changes something, same as /equipo's server-precomputed `initialRows`. */
  initialRows: FlipRow[];
  totalCount: number;
  title: string;
  description: string;
}) {
  const t = useTranslations("flipping.explorer");
  const [params, setParams] = useState<FlipParams>(DEFAULT_FLIP_PARAMS);
  const [filters, setFilters] = useState<FlipFilterParams>(DEFAULT_FLIP_FILTERS);
  const [sortKey, setSortKey] = useState<FlipSortKey>("platinumPerDay");
  const [desc, setDesc] = useState(true);
  const isDefaultSort = sortKey === "platinumPerDay" && desc;
  function onSortChange(key: FlipSortKey) {
    if (key === sortKey) setDesc((d) => !d);
    else {
      setSortKey(key);
      setDesc(true);
    }
  }

  const [isPending, startTransition] = useTransition();
  const applyParams = (next: FlipParams) => startTransition(() => setParams(next));
  const applyFilterParams = (next: FlipFilterParams) => startTransition(() => setFilters(next));

  const restoredFromUrl = useRef(false);
  useEffect(() => {
    const restored = parseStateFromUrl();
    if (restored) {
      setParams(restored.params);
      setFilters(restored.filters);
    }
    restoredFromUrl.current = true;
  }, []);

  useEffect(() => {
    if (!restoredFromUrl.current) return;
    writeStateToUrl(params, filters);
  }, [params, filters]);

  const isDefaultView = params === DEFAULT_FLIP_PARAMS && JSON.stringify(filters) === JSON.stringify(DEFAULT_FLIP_FILTERS) && isDefaultSort;
  const [remoteResult, setRemoteResult] = useState<{ rows: FlipRow[]; total: number } | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteError, setRemoteError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Flipping is always remote (decision: ranking remoto tipo Equipo) -- every filter/param change
  // re-ranks server-side. Same P0 rule as /equipo: the sort has to travel with the request, since
  // the server only ships the top FLIP_ROW_LIMIT rows ranked by one column.
  useEffect(() => {
    if (isDefaultView) {
      setRemoteResult(null);
      setRemoteError(false);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setRemoteLoading(true);
      setRemoteError(false);
      try {
        const res = await fetch("/api/rank-flip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ params, filters, sort: { key: sortKey, desc } }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        setRemoteResult(await res.json());
        setRemoteLoading(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setRemoteError(true);
        setRemoteLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [isDefaultView, params, filters, sortKey, desc, retryKey]);

  const allRows = remoteResult?.rows ?? initialRows;
  const totalMatching = remoteResult?.total ?? totalCount;

  const rows = useMemo(() => applyFlipFilters(allRows, filters), [allRows, filters]);

  return (
    <div className="flex flex-col gap-3">
      <SiteHeader title={title} description={description} bleed showServerBadge />
      <NameSearchField value={filters.nameQuery} onChange={(nameQuery) => applyFilterParams({ ...filters, nameQuery })} />
      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:items-stretch lg:gap-8">
        <FlipFiltersPanel params={params} onParamsChange={applyParams} filters={filters} onFiltersChange={applyFilterParams} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {totalMatching > rows.length ? t("showingTop", { shown: rows.length, total: totalMatching }) : t("showing", { shown: rows.length, total: totalMatching })}
              {(isPending || remoteLoading) && (
                <span className="inline-flex items-center gap-1 text-money">
                  <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  {t("recalculatingFull")}
                </span>
              )}
            </p>
            <div role="status" aria-live="polite" className="sr-only">
              {isPending || remoteLoading ? t("recalculatingSr") : ""}
            </div>
            {remoteError && (
              <p role="alert" className="flex items-center gap-2 text-xs text-destructive">
                {t("recalcFailed")}
                <button type="button" onClick={() => setRetryKey((n) => n + 1)} className="rounded-sm border border-destructive/50 px-2 py-0.5 hover:bg-destructive/10">
                  {t("retry")}
                </button>
              </p>
            )}
            <ActiveFilterChips params={params} onParamsChange={applyParams} filters={filters} onFiltersChange={applyFilterParams} />
          </div>
          <div className="relative">
            <FlipTable
              rows={rows}
              isFiltered={filters.nameQuery !== "" || filters.maxAgeHours !== null || filters.minVolume !== null || filters.minMarginPct !== null}
              onClearFilters={() => applyFilterParams(DEFAULT_FLIP_FILTERS)}
              sortKey={sortKey}
              desc={desc}
              onSortChange={onSortChange}
              className={isPending || remoteLoading ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}
            />
            {(isPending || remoteLoading) && (
              <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center" aria-hidden="true">
                <div className="flex items-center gap-2 rounded-full border border-money/50 bg-background/95 px-3 py-1.5 text-xs text-money shadow-none">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  {t("recalculating")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <FlipControls params={params} onParamsChange={applyParams} filters={filters} onFiltersChange={applyFilterParams} />
    </div>
  );
}

function ActiveFilterChips({
  params,
  onParamsChange,
  filters,
  onFiltersChange,
}: {
  params: FlipParams;
  onParamsChange: (params: FlipParams) => void;
  filters: FlipFilterParams;
  onFiltersChange: (filters: FlipFilterParams) => void;
}) {
  const t = useTranslations("flipping.explorer");
  const chips: { key: string; label: string; onClear: () => void }[] = [];

  if (filters.nameQuery !== "") {
    chips.push({ key: "name", label: `"${filters.nameQuery}"`, onClear: () => onFiltersChange({ ...filters, nameQuery: "" }) });
  }
  if (filters.minMarginPct !== null) {
    chips.push({ key: "margin", label: t("chipMargin", { value: filters.minMarginPct }), onClear: () => onFiltersChange({ ...filters, minMarginPct: null }) });
  }
  if (filters.minVolume !== null) {
    chips.push({ key: "vol", label: t("chipVolume", { volume: filters.minVolume }), onClear: () => onFiltersChange({ ...filters, minVolume: null }) });
  }
  if (filters.maxAgeHours !== null) {
    chips.push({ key: "age", label: t("chipAge", { hours: filters.maxAgeHours }), onClear: () => onFiltersChange({ ...filters, maxAgeHours: null }) });
  }
  if (params.buyCities.length !== DEFAULT_FLIP_PARAMS.buyCities.length) {
    chips.push({ key: "buy", label: t("chipBuy", { count: params.buyCities.length }), onClear: () => onParamsChange({ ...params, buyCities: DEFAULT_FLIP_PARAMS.buyCities }) });
  }
  if (params.sellCities.length !== DEFAULT_FLIP_PARAMS.sellCities.length) {
    chips.push({ key: "sell", label: t("chipSell", { count: params.sellCities.length }), onClear: () => onParamsChange({ ...params, sellCities: DEFAULT_FLIP_PARAMS.sellCities }) });
  }
  if (params.marketShare !== DEFAULT_FLIP_PARAMS.marketShare) {
    chips.push({
      key: "share",
      label: t("chipShare", { value: Math.round(params.marketShare * 100) }),
      onClear: () => onParamsChange({ ...params, marketShare: DEFAULT_FLIP_PARAMS.marketShare }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          aria-label={t("removeFilter", { label: chip.label })}
          className="relative flex shrink-0 items-center gap-1 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs text-foreground transition-colors after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] hover:bg-accent/40"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </>
  );
}
