"use client";

import { useMemo, useState } from "react";
import { RecipeTable } from "./recipe-table";
import { RecipeHeader } from "./recipe-header";
import { Controls, DEFAULT_FILTERS, type FilterParams } from "./controls";
import { computeRecipeRow, DEFAULT_PARAMS, type CityPricePoint, type RecipeMathParams, type RecipeRow } from "@/lib/recipe-math";
import { getCitySpecialty, type CitySpecialty } from "@/lib/city-specialties";
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
      <RecipeHeader
        title={title}
        description={description}
        craftCity={params.craftCity}
        onCraftCityChange={(craftCity) => setParams({ ...params, craftCity })}
        cityBonuses={cityBonuses}
      />
      <p className="text-xs text-muted-foreground">
        Mostrando {rows.length} de {allRows.length} recetas.
      </p>
      <RecipeTable rows={rows} />
      <Controls params={params} onParamsChange={setParams} filters={filters} onFiltersChange={setFilters} />
    </div>
  );
}

function applyFilters(rows: RecipeRow[], filters: FilterParams): RecipeRow[] {
  return rows.filter((r) => {
    if (filters.maxAgeHours !== null) {
      const ageHours = r.sellRefAgeSeconds !== null ? r.sellRefAgeSeconds / 3600 : Infinity;
      if (ageHours > filters.maxAgeHours) return false;
    }
    if (filters.minVolume !== null && r.avgDailyVolume30d < filters.minVolume) return false;
    return true;
  });
}
