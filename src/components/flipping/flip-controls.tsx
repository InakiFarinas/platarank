"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BLACK_MARKET, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { DEFAULT_FLIP_PARAMS, type FlipParams } from "@/lib/flip-math";
import { DEFAULT_FLIP_FILTERS, type FlipFilterParams } from "@/lib/flip-filters";
import { CitySection, FilterCard, NumberField, NameSearchField as RecipeNameSearchField } from "@/components/recipes/controls";
import { InfoTip, Segmented } from "@/components/calculator/ui";

export function NameSearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations("flipping.controls");
  return <RecipeNameSearchField value={value} onChange={onChange} label={t("searchLabel")} placeholder={t("searchPlaceholder")} />;
}

type FlipControlsProps = {
  params: FlipParams;
  onParamsChange: (params: FlipParams) => void;
  filters: FlipFilterParams;
  onFiltersChange: (filters: FlipFilterParams) => void;
};

function useFlipFilterActions({ params, onParamsChange, filters, onFiltersChange }: FlipControlsProps) {
  const [resetCount, setResetCount] = useState(0);

  function toggleCity(key: "buyCities" | "sellCities", city: Location, checked: boolean) {
    const current = params[key];
    const next = checked ? [...current, city] : current.filter((c) => c !== city);
    onParamsChange({ ...params, [key]: next });
  }

  function resetToDefaults() {
    onParamsChange(DEFAULT_FLIP_PARAMS);
    onFiltersChange(DEFAULT_FLIP_FILTERS);
    setResetCount((n) => n + 1);
  }

  const isChanged =
    JSON.stringify(params) !== JSON.stringify(DEFAULT_FLIP_PARAMS) || JSON.stringify(filters) !== JSON.stringify(DEFAULT_FLIP_FILTERS);

  return { resetCount, toggleCity, resetToDefaults, isChanged };
}

/** Mobile: floating button + bottom sheet, same convention as /equipo's Controls. */
export function FlipControls(props: FlipControlsProps) {
  const t = useTranslations("flipping.controls");
  const { resetCount, toggleCity, resetToDefaults, isChanged } = useFlipFilterActions(props);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label={isChanged ? t("filtersAndAssumptionsChanged") : t("filtersAndAssumptions")}
            className="fixed bottom-4 right-4 z-30 flex h-13 w-13 items-center justify-center rounded-full border-2 border-double border-border bg-card text-foreground transition-colors hover:bg-accent/60 sm:bottom-6 sm:right-6 lg:hidden"
          >
            <SlidersHorizontal className="h-5 w-5" />
            {isChanged && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-money" aria-hidden="true" />}
          </button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto border-t-2 border-double lg:hidden">
        <SheetHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <SheetTitle className="font-heading text-base">{t("filtersAndAssumptions")}</SheetTitle>
          {isChanged && (
            <button type="button" onClick={resetToDefaults} className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
              {t("restoreDefaults")}
            </button>
          )}
        </SheetHeader>
        <div className="px-4 pb-6">
          <FlipFilterFields {...props} resetCount={resetCount} toggleCity={toggleCity} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Desktop: always-visible sidebar, same convention as /equipo's FiltersPanel. */
export function FlipFiltersPanel(props: FlipControlsProps) {
  const t = useTranslations("flipping.controls");
  const { resetCount, toggleCity, resetToDefaults, isChanged } = useFlipFilterActions(props);

  return (
    <div className="hidden lg:block">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="font-heading text-base">{t("filtersAndAssumptions")}</h2>
        {isChanged && (
          <button type="button" onClick={resetToDefaults} className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
            {t("restoreDefaults")}
          </button>
        )}
      </div>
      <FlipFilterFields {...props} resetCount={resetCount} toggleCity={toggleCity} />
    </div>
  );
}

function FlipFilterFields({
  params,
  onParamsChange,
  filters,
  onFiltersChange,
  resetCount,
  toggleCity,
}: FlipControlsProps & { resetCount: number; toggleCity: (key: "buyCities" | "sellCities", city: Location, checked: boolean) => void }) {
  const t = useTranslations("flipping.controls");
  return (
    <div className="flex flex-col gap-4">
      <FilterCard title={t("cities")}>
        <div className="grid gap-4 @sm:grid-cols-2">
          <CitySection
            title={t("buyItemIn")}
            icon={ArrowDownToLine}
            cities={REAL_CITIES}
            selected={params.buyCities}
            onToggle={(city, checked) => toggleCity("buyCities", city, checked)}
          />
          <CitySection
            title={t("sellItemIn")}
            icon={ArrowUpFromLine}
            cities={REAL_CITIES}
            selected={params.sellCities}
            onToggle={(city, checked) => toggleCity("sellCities", city, checked)}
            extra={{
              label: t("blackMarket"),
              checked: params.sellCities.includes(BLACK_MARKET),
              onToggle: (checked) => toggleCity("sellCities", BLACK_MARKET, checked),
              note: t("blackMarketNote"),
            }}
          />
        </div>
      </FilterCard>

      <FilterCard title={t("buyMethod")}>
        <Segmented
          label={t("buyMethodLabel")}
          labelHint={<InfoTip term="" ariaLabel={t("buyMethodInfoLabel")} text={t("buyMethodInfo")} />}
          value={params.buyMethodPref}
          options={[
            { value: "auto", text: t("buyMethodAuto") },
            { value: "instant", text: t("buyMethodInstantOnly") },
            { value: "order", text: t("buyMethodOrderOnly") },
          ]}
          onChange={(buyMethodPref) => onParamsChange({ ...params, buyMethodPref })}
        />
      </FilterCard>

      <FilterCard title={t("assumptions")}>
        <NumberField
          key={`market-share-${resetCount}`}
          label={t("marketShare")}
          hint={t("marketShareHint")}
          value={Math.round(params.marketShare * 100)}
          min={1}
          max={100}
          required
          onChange={(v) => v !== null && onParamsChange({ ...params, marketShare: v / 100 })}
        />
      </FilterCard>

      <FilterCard title={t("listFilters")} collapsible startOpen={filters.minMarginPct !== null || filters.minVolume !== null || filters.maxAgeHours !== null}>
        <div className="grid gap-4 @sm:grid-cols-2">
          <NumberField
            key={`min-margin-${resetCount}`}
            label={t("minMargin")}
            placeholder={t("noMinMargin")}
            value={filters.minMarginPct}
            min={0}
            onChange={(v) => onFiltersChange({ ...filters, minMarginPct: v })}
          />
          <NumberField
            key={`min-volume-${resetCount}`}
            label={t("minVolume")}
            placeholder={t("noMinimum")}
            value={filters.minVolume}
            min={0}
            onChange={(v) => onFiltersChange({ ...filters, minVolume: v })}
          />
          <NumberField
            key={`max-age-${resetCount}`}
            label={t("maxAge")}
            placeholder={t("noLimit")}
            value={filters.maxAgeHours}
            min={0}
            onChange={(v) => onFiltersChange({ ...filters, maxAgeHours: v })}
          />
        </div>
      </FilterCard>
    </div>
  );
}
