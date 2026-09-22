"use client";

import { useEffect, useId, useState, type ComponentType, type ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { BLACK_MARKET, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { CITY_THEMES } from "@/lib/city-theme";
import type { CitySpecialty } from "@/lib/city-specialties";
import { DEFAULT_PARAMS, type RecipeMathParams } from "@/lib/recipe-math";
import { DEFAULT_FILTERS, type FilterParams } from "@/lib/recipe-filters";
import { BONUS_LABEL, CityGlyph } from "@/components/site-header";
import type { StationType } from "@/lib/server/station-data";
import { cn } from "@/lib/utils";

export type { FilterParams };

export { DEFAULT_FILTERS };

type ControlsProps = {
  params: RecipeMathParams;
  onParamsChange: (params: RecipeMathParams) => void;
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  /** Which bonus (if any) each city offers for this rubro's recipe categories -- badges the
   * "Ciudad de crafteo" selector's options, same map the header's city selector used to badge. */
  cityBonuses: Map<Location, CitySpecialty>;
  /** Only /monturas shows the "criar el animal base" toggle. */
  stationType: StationType;
};

function useFilterActions({ params, onParamsChange, filters, onFiltersChange }: ControlsProps) {
  // Bumped on every reset so the NumberFields below remount and drop any stale local error/clamp
  // message instead of carrying it over from before the reset.
  const [resetCount, setResetCount] = useState(0);

  function toggleCity(key: "buyCities" | "sellCities", city: Location, checked: boolean) {
    const current = params[key];
    const next = checked ? [...current, city] : current.filter((c) => c !== city);
    onParamsChange({ ...params, [key]: next });
  }

  function resetToDefaults() {
    onParamsChange(DEFAULT_PARAMS);
    onFiltersChange(DEFAULT_FILTERS);
    setResetCount((n) => n + 1);
  }

  const isChanged =
    JSON.stringify(params) !== JSON.stringify(DEFAULT_PARAMS) ||
    JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return { resetCount, toggleCity, resetToDefaults, isChanged };
}

/** Mobile: screen space is too scarce for the filters to stay visible, so they live behind a
 * floating button + bottom sheet. Hidden from `lg:` up, where `FiltersPanel` takes over. */
export function Controls(props: ControlsProps) {
  const { resetCount, toggleCity, resetToDefaults, isChanged } = useFilterActions(props);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label={isChanged ? "Filtros y supuestos (modificado)" : "Filtros y supuestos"}
            className="fixed bottom-4 right-4 z-30 flex h-13 w-13 items-center justify-center rounded-full border-2 border-double border-border bg-card text-foreground transition-colors hover:bg-accent/60 sm:bottom-6 sm:right-6 lg:hidden"
          >
            <SlidersHorizontal className="h-5 w-5" />
            {isChanged && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-money" aria-hidden="true" />
            )}
          </button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto border-t-2 border-double lg:hidden">
        <SheetHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <SheetTitle className="font-heading text-base">Filtros y supuestos</SheetTitle>
          {isChanged && (
            <button
              type="button"
              onClick={resetToDefaults}
              className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Restaurar valores por defecto
            </button>
          )}
        </SheetHeader>

        <div className="px-4 pb-6">
          <FilterFields {...props} resetCount={resetCount} toggleCity={toggleCity} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Desktop: enough room to keep the filters visible at all times as a sidebar, no click required.
 * Hidden below `lg:`, where `Controls`' floating button + sheet takes over instead. */
export function FiltersPanel(props: ControlsProps) {
  const { resetCount, toggleCity, resetToDefaults, isChanged } = useFilterActions(props);

  return (
    <div className="hidden lg:block">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="font-heading text-base">Filtros y supuestos</h2>
        {isChanged && (
          <button
            type="button"
            onClick={resetToDefaults}
            className="shrink-0 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Restaurar valores por defecto
          </button>
        )}
      </div>
      <FilterFields {...props} resetCount={resetCount} toggleCity={toggleCity} />
    </div>
  );
}

function FilterFields({
  params,
  onParamsChange,
  filters,
  onFiltersChange,
  cityBonuses,
  stationType,
  resetCount,
  toggleCity,
}: ControlsProps & {
  resetCount: number;
  toggleCity: (key: "buyCities" | "sellCities", city: Location, checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FilterCard title="Ciudad de crafteo">
        <div className="grid grid-cols-2 gap-1.5 @sm:grid-cols-3">
          {REAL_CITIES.map((city) => {
            const theme = CITY_THEMES[city];
            const active = city === params.craftCity;
            const bonus = cityBonuses.get(city);
            return (
              <button
                key={city}
                type="button"
                aria-pressed={active}
                onClick={() => onParamsChange({ ...params, craftCity: city })}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors after:absolute after:-inset-y-1 after:inset-x-0 after:content-['']",
                  active ? cn(theme.border, theme.bg, theme.text) : "border-border text-muted-foreground hover:border-money/30 hover:text-foreground",
                )}
              >
                <CityGlyph theme={theme} />
                <span className="min-w-0 flex-1 truncate text-left font-medium">{city}</span>
                {bonus && (
                  <span className="shrink-0 font-mono text-[0.6875rem] tabular-nums text-money">{BONUS_LABEL[bonus.kind]}</span>
                )}
              </button>
            );
          })}
        </div>
      </FilterCard>

      <FilterCard title="Ciudades">
        <div className="grid gap-4 @sm:grid-cols-2">
          <CitySection
            title="Comprar materiales en"
            icon={ArrowDownToLine}
            cities={REAL_CITIES}
            selected={params.buyCities}
            onToggle={(city, checked) => toggleCity("buyCities", city, checked)}
          />

          <CitySection
            title="Vender el ítem en"
            icon={ArrowUpFromLine}
            cities={REAL_CITIES}
            selected={params.sellCities}
            onToggle={(city, checked) => toggleCity("sellCities", city, checked)}
            extra={{
              label: "Black Market",
              checked: params.sellCities.includes(BLACK_MARKET),
              onToggle: (checked) => toggleCity("sellCities", BLACK_MARKET, checked),
              note: "Solo compra: vendés contra la mejor oferta, que puede desaparecer antes de que llegues.",
            }}
          />
        </div>
      </FilterCard>

      <FilterCard title="Supuestos de cálculo">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="focus-switch">Foco activado</Label>
          <Switch
            id="focus-switch"
            checked={params.focus}
            onCheckedChange={(checked) => onParamsChange({ ...params, focus: checked })}
          />
        </div>

        {stationType === "mount" && (
          <div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="breed-switch">Criar caballo/buey en vez de comprarlo</Label>
              <Switch
                id="breed-switch"
                checked={params.breedOwnMount}
                onCheckedChange={(checked) => onParamsChange({ ...params, breedOwnMount: checked })}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Reemplaza el precio de mercado del animal adulto por el costo de criarlo vos: la cría al Mercader de granja (precio fijo) más el
              alimento más barato disponible. Solo caballo y buey tienen precio de cría fijo -- las demás monturas (ciervo, lobo, dragón de
              pantano...) no cambian.
            </p>
          </div>
        )}

        <div className="grid gap-4 @sm:grid-cols-2">
          <NumberField
            key={`market-share-${resetCount}`}
            label="Cuota de mercado (%)"
            hint="Qué parte del volumen de ventas diario asumís poder capturar vos."
            value={Math.round(params.marketShare * 100)}
            min={1}
            max={100}
            required
            onChange={(v) => v !== null && onParamsChange({ ...params, marketShare: v / 100 })}
          />

          <NumberField
            key={`station-rate-${resetCount}`}
            label="Tarifa de estación"
            hint="Plata que cobra Albion por craftear, cada 100 de nutrición consumida."
            value={params.stationRatePer100Nutrition}
            min={0}
            required
            onChange={(v) => v !== null && onParamsChange({ ...params, stationRatePer100Nutrition: v })}
          />
        </div>
      </FilterCard>

      <FilterCard title="Filtros de listado">
        <div className="grid gap-4 @sm:grid-cols-2">
          <NumberField
            key={`max-age-${resetCount}`}
            label="Antigüedad máxima (horas)"
            placeholder="sin límite"
            value={filters.maxAgeHours}
            min={0}
            onChange={(v) => onFiltersChange({ ...filters, maxAgeHours: v })}
          />

          <NumberField
            key={`min-volume-${resetCount}`}
            label="Volumen mínimo diario"
            placeholder="sin mínimo"
            value={filters.minVolume}
            min={0}
            onChange={(v) => onFiltersChange({ ...filters, minVolume: v })}
          />
        </div>
      </FilterCard>
    </div>
  );
}

/** The one control players reach for when they want a SPECIFIC item rather than "what's best" --
 * everything else here is an assumption or a threshold, but with thousands of recipes on /equipo,
 * paging through the sorted list by hand isn't a real path to "does this app cover my item".
 * Rendered once, always visible above the table (not inside the Filtros sheet/sidebar), so it
 * doesn't cost mobile an extra tap to reach the control it needs most on the densest rubro. */
export function NameSearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Label htmlFor={id} className="sr-only">
        Buscar receta por nombre
      </Label>
      <Input
        id={id}
        type="search"
        placeholder="Buscar receta por nombre..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9"
      />
      {value !== "" && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function FilterCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="@container rounded-md border border-border bg-card/40 p-4">
      <h2 className="mb-3 font-heading text-sm">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function CitySection({
  title,
  icon: Icon,
  cities,
  selected,
  onToggle,
  extra,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  cities: readonly Location[];
  selected: Location[];
  onToggle: (city: Location, checked: boolean) => void;
  extra?: { label: string; checked: boolean; onToggle: (checked: boolean) => void; note: string };
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {cities.map((city) => {
          const active = selected.includes(city);
          return (
            <button
              key={city}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(city, !active)}
              className={cn(
                "relative rounded-full border px-3 py-1 text-xs transition-colors after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-['']",
                active ? "border-money bg-money/10 text-money" : "border-border text-muted-foreground hover:border-money/30 hover:text-foreground",
              )}
            >
              {city}
            </button>
          );
        })}
      </div>
      {extra && (
        <div className="mt-2 rounded-md border border-border px-3 py-2">
          <label className="flex min-h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={extra.checked}
              onChange={(e) => extra.onToggle(e.target.checked)}
              className="h-5 w-5 accent-money"
            />
            {extra.label}
          </label>
          <p className="mt-1 text-xs text-muted-foreground">{extra.note}</p>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  placeholder,
  required,
}: {
  label: string;
  /** One-line answer to "what does this control actually do", shown under the label -- for
   * assumptions whose name alone doesn't explain their effect (e.g. "Cuota de mercado"). */
  hint?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  required?: boolean;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [raw, setRaw] = useState(value === null ? "" : String(value));
  const [error, setError] = useState<string | null>(null);

  // Keep the field in sync when the value changes from outside (e.g. "Restaurar valores por defecto").
  // Deliberately doesn't clear `error` here: committing a clamped value updates `value` right away,
  // which would otherwise wipe the "ajustado a X" message before the user ever sees it.
  useEffect(() => {
    setRaw(value === null ? "" : String(value));
  }, [value]);

  function commit(nextRaw: string) {
    if (nextRaw.trim() === "") {
      if (required) {
        setError("Este campo es obligatorio.");
        return;
      }
      setError(null);
      onChange(null);
      return;
    }
    const parsed = Number(nextRaw);
    if (Number.isNaN(parsed)) {
      setError("Ingresá un número válido.");
      return;
    }
    let clamped = parsed;
    if (min !== undefined && clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;
    setError(clamped !== parsed ? `Ajustado a ${clamped} (${clamped === min ? "mínimo" : "máximo"} permitido).` : null);
    setRaw(String(clamped));
    onChange(clamped);
  }

  return (
    <div>
      <Label htmlFor={id} className={cn("block", !hint && "mb-1.5")}>
        {label}
      </Label>
      {hint && <p className="mb-1.5 mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={raw}
        min={min}
        max={max}
        placeholder={placeholder}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(error && "border-destructive focus-visible:ring-destructive/40")}
        onChange={(e) => {
          setRaw(e.target.value);
          setError(null);
        }}
        onBlur={(e) => commit(e.target.value)}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
