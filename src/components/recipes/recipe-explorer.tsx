"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { RecipeTable } from "./recipe-table";
import { SiteHeader } from "@/components/site-header";
import { Controls, FiltersPanel, NameSearchField, DEFAULT_FILTERS, type FilterParams } from "./controls";
import { computeRecipeRow, DEFAULT_PARAMS, type CityPricePoint, type RecipeMathParams, type RecipeRow } from "@/lib/recipe-math";
import { getCitySpecialty, type CitySpecialty } from "@/lib/city-specialties";
import { parseStateFromUrl, writeStateToUrl } from "./url-state";
import type { Recipe } from "@/lib/db/schema";
import type { Location } from "@/lib/aodp/cities";

export function RecipeExplorer({
  recipes,
  marketByItem,
  initialRows,
  title,
  description,
}: {
  recipes: Recipe[];
  marketByItem: Record<string, CityPricePoint[]>;
  /** Pre-reduced with DEFAULT_PARAMS on the server -- reused as-is until the player changes a
   * control, so first paint skips the client-side recompute over every recipe. */
  initialRows: RecipeRow[];
  title: string;
  description: string;
}) {
  const [params, setParams] = useState<RecipeMathParams>(DEFAULT_PARAMS);
  const [filters, setFilters] = useState<FilterParams>(DEFAULT_FILTERS);

  // The recompute below can measure 10-20+ seconds on /equipo's ~5,600 rows -- marking the state
  // update as a transition keeps the current rows interactive (and `isPending` visible) instead of
  // freezing the page with no feedback while it runs.
  const [isPending, startTransition] = useTransition();
  const applyParams = (next: RecipeMathParams) => startTransition(() => setParams(next));
  const applyFilterParams = (next: FilterParams) => startTransition(() => setFilters(next));

  // Restore a shared/bookmarked view once on mount -- deliberately not in the initial `useState`
  // so the very first render still matches the server-rendered defaults for hydration.
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

  const market = useMemo(() => new Map(Object.entries(marketByItem)), [marketByItem]);

  const allRows = useMemo(
    () => (params === DEFAULT_PARAMS ? initialRows : recipes.map((r) => computeRecipeRow(r, market, params))),
    [recipes, market, params, initialRows],
  );

  const rows = useMemo(() => applyFilters(allRows, filters), [allRows, filters]);

  // Which bonus (if any) each city offers for THIS rubro's categories, for the city-selector
  // dropdown's badge. A city either has a specialty among this page's categories or it doesn't --
  // within one rubro every matching category shares the same kind (crafting for alquimia/cocina/
  // equipo, refining for refinado), so at most one badge per city here.
  const cityBonuses = useMemo(() => {
    const categories = new Set(recipes.map((r) => r.craftingCategory).filter((c): c is string => c !== null));
    const bonuses = new Map<Location, CitySpecialty>();
    for (const category of categories) {
      const spec = getCitySpecialty(category);
      if (spec) bonuses.set(spec.city as Location, spec);
    }
    return bonuses;
  }, [recipes]);

  return (
    <div className="flex flex-col gap-3">
      <SiteHeader
        title={title}
        description={description}
        bleed
        recipeControls={{
          craftCity: params.craftCity,
          onCraftCityChange: (craftCity) => applyParams({ ...params, craftCity }),
          cityBonuses,
        }}
      />
      <NameSearchField value={filters.nameQuery} onChange={(nameQuery) => applyFilterParams({ ...filters, nameQuery })} />
      <div className="lg:grid lg:grid-cols-[300px_1fr] lg:items-stretch lg:gap-8">
        <FiltersPanel params={params} onParamsChange={applyParams} filters={filters} onFiltersChange={applyFilterParams} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Mostrando {rows.length} de {allRows.length} recetas.
              {isPending && (
                <span className="inline-flex items-center gap-1 text-money">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  Recalculando con los nuevos supuestos...
                </span>
              )}
            </p>
            <ActiveFilterChips params={params} onParamsChange={applyParams} filters={filters} onFiltersChange={applyFilterParams} />
          </div>
          <div className="relative">
            <RecipeTable
              rows={rows}
              isFiltered={filters.nameQuery !== "" || filters.maxAgeHours !== null || filters.minVolume !== null}
              onClearFilters={() => applyFilterParams(DEFAULT_FILTERS)}
              className={isPending ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}
            />
            {isPending && (
              <div
                className="pointer-events-none absolute inset-x-0 top-16 flex justify-center"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-2 rounded-full border border-money/50 bg-background/95 px-3 py-1.5 text-xs text-money shadow-none">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Recalculando...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Controls params={params} onParamsChange={applyParams} filters={filters} onFiltersChange={applyFilterParams} />
    </div>
  );
}

/** The only always-visible trace that "Mostrando X de Y" is filtered at all -- the filters panel
 * itself can be scrolled past (desktop sidebar) or closed (mobile sheet) with no other reminder
 * of what's currently narrowing the list. Each chip both names its filter and clears it. */
function ActiveFilterChips({
  params,
  onParamsChange,
  filters,
  onFiltersChange,
}: {
  params: RecipeMathParams;
  onParamsChange: (params: RecipeMathParams) => void;
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
}) {
  const chips: { key: string; label: string; onClear: () => void }[] = [];

  if (filters.nameQuery !== "") {
    chips.push({
      key: "name",
      label: `"${filters.nameQuery}"`,
      onClear: () => onFiltersChange({ ...filters, nameQuery: "" }),
    });
  }
  if (filters.maxAgeHours !== null) {
    chips.push({
      key: "age",
      label: `Antigüedad <= ${filters.maxAgeHours}h`,
      onClear: () => onFiltersChange({ ...filters, maxAgeHours: null }),
    });
  }
  if (filters.minVolume !== null) {
    chips.push({
      key: "vol",
      label: `Volumen >= ${filters.minVolume}`,
      onClear: () => onFiltersChange({ ...filters, minVolume: null }),
    });
  }
  if (params.buyCities.length !== DEFAULT_PARAMS.buyCities.length) {
    chips.push({
      key: "buy",
      label: `Comprar en ${params.buyCities.length} ciudad${params.buyCities.length === 1 ? "" : "es"}`,
      onClear: () => onParamsChange({ ...params, buyCities: DEFAULT_PARAMS.buyCities }),
    });
  }
  if (params.sellCities.length !== DEFAULT_PARAMS.sellCities.length) {
    chips.push({
      key: "sell",
      label: `Vender en ${params.sellCities.length} ciudad${params.sellCities.length === 1 ? "" : "es"}`,
      onClear: () => onParamsChange({ ...params, sellCities: DEFAULT_PARAMS.sellCities }),
    });
  }
  if (params.focus !== DEFAULT_PARAMS.focus) {
    chips.push({ key: "focus", label: "Foco activado", onClear: () => onParamsChange({ ...params, focus: DEFAULT_PARAMS.focus }) });
  }

  if (chips.length === 0) return null;

  return (
    <>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          aria-label={`Quitar filtro: ${chip.label}`}
          className="relative flex shrink-0 items-center gap-1 rounded-full border border-money/50 bg-money/10 px-2.5 py-1 text-xs text-money transition-colors after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] hover:bg-money/20"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </>
  );
}

/** Strips accents so "pocion" matches "Poción" -- players typing on a phone next to the game
 * shouldn't have to hit the right diacritic to find an item. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function applyFilters(rows: RecipeRow[], filters: FilterParams): RecipeRow[] {
  const query = normalize(filters.nameQuery.trim());
  return rows.filter((r) => {
    if (query !== "" && !normalize(r.recipe.nameEs).includes(query)) return false;
    if (filters.maxAgeHours !== null) {
      const ageHours = r.sellRefAgeSeconds !== null ? r.sellRefAgeSeconds / 3600 : Infinity;
      if (ageHours > filters.maxAgeHours) return false;
    }
    if (filters.minVolume !== null && r.avgDailyVolume30d < filters.minVolume) return false;
    return true;
  });
}
