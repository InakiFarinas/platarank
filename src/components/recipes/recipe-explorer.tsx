"use client";

import { useMemo, useState } from "react";
import { RecipeTable } from "./recipe-table";
import { Controls, type FilterParams } from "./controls";
import { computeRecipeRow, DEFAULT_PARAMS, type CityPricePoint, type RecipeMathParams, type RecipeRow } from "@/lib/recipe-math";
import type { Recipe } from "@/lib/db/schema";

const DEFAULT_FILTERS: FilterParams = { maxAgeHours: null, minVolume: null };

export function RecipeExplorer({
  recipes,
  marketByItem,
  stationType,
}: {
  recipes: Recipe[];
  marketByItem: Record<string, CityPricePoint[]>;
  stationType: "alchemy" | "refining" | "cooking" | "gear";
}) {
  const [params, setParams] = useState<RecipeMathParams>(DEFAULT_PARAMS);
  const [filters, setFilters] = useState<FilterParams>(DEFAULT_FILTERS);

  const market = useMemo(() => new Map(Object.entries(marketByItem)), [marketByItem]);

  const allRows = useMemo(() => recipes.map((r) => computeRecipeRow(r, market, params)), [recipes, market, params]);

  const rows = useMemo(() => applyFilters(allRows, filters), [allRows, filters]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Mostrando {rows.length} de {allRows.length} recetas.
        </p>
        <Controls
          params={params}
          onParamsChange={setParams}
          filters={filters}
          onFiltersChange={setFilters}
          stationType={stationType}
        />
      </div>
      <RecipeTable rows={rows} />
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
