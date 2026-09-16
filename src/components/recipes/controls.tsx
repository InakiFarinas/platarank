"use client";

import { SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { BLACK_MARKET, REAL_CITIES, type Location } from "@/lib/aodp/cities";
import type { RecipeMathParams } from "@/lib/recipe-math";

export type FilterParams = {
  maxAgeHours: number | null;
  minVolume: number | null;
};

export function Controls({
  params,
  onParamsChange,
  filters,
  onFiltersChange,
  stationType,
}: {
  params: RecipeMathParams;
  onParamsChange: (params: RecipeMathParams) => void;
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  stationType: "alchemy" | "refining" | "cooking" | "gear";
}) {
  function toggleCity(key: "buyCities" | "sellCities", city: Location, checked: boolean) {
    const current = params[key];
    const next = checked ? [...current, city] : current.filter((c) => c !== city);
    onParamsChange({ ...params, [key]: next });
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label="Filtros y supuestos"
            className="fixed bottom-4 right-4 z-30 flex h-13 w-13 items-center justify-center rounded-full border-2 border-double border-border bg-card text-foreground transition-colors hover:bg-accent/60 sm:bottom-6 sm:right-6"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto border-t-2 border-double">
        <SheetHeader>
          <SheetTitle className="font-heading text-base">Filtros y supuestos</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-6">
          <CitySection
            title="Comprar materiales en"
            cities={REAL_CITIES}
            selected={params.buyCities}
            onToggle={(city, checked) => toggleCity("buyCities", city, checked)}
          />

          <CitySection
            title="Vender el ítem en"
            cities={REAL_CITIES}
            selected={params.sellCities}
            onToggle={(city, checked) => toggleCity("sellCities", city, checked)}
            extra={{
              label: "Black Market",
              checked: params.sellCities.includes(BLACK_MARKET),
              onToggle: (checked) => toggleCity("sellCities", BLACK_MARKET, checked),
              note: "Solo órdenes de compra -- vendés contra la oferta más alta, sin garantía de que siga ahí.",
            }}
          />

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="focus-switch">Foco activado</Label>
              <p className="text-xs text-muted-foreground">+59% de retorno de materiales.</p>
            </div>
            <Switch
              id="focus-switch"
              checked={params.focus}
              onCheckedChange={(checked) => onParamsChange({ ...params, focus: checked })}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            El escudo junto a la navegación elige dónde craftea: cada receta tiene como mucho una ciudad con
            especialidad para su categoría (potion → Brecilien, wood → Fort Sterling, sword → Thetford, etc.) -- si
            coincide, aplica el bonus de +15%/+40%.
          </p>

          {stationType === "gear" && (
            <QualityWeightsField weights={params.qualityWeights} onChange={(w) => onParamsChange({ ...params, qualityWeights: w })} />
          )}

          <NumberField
            label="Cuota de mercado (%)"
            value={Math.round(params.marketShare * 100)}
            min={1}
            max={100}
            onChange={(v) => v !== null && onParamsChange({ ...params, marketShare: v / 100 })}
          />

          <NumberField
            label="Tarifa de estación (por 100 nutrición)"
            value={params.stationRatePer100Nutrition}
            min={0}
            onChange={(v) => v !== null && onParamsChange({ ...params, stationRatePer100Nutrition: v })}
          />

          <Separator />

          <NumberField
            label="Antigüedad máxima del dato (horas)"
            placeholder="sin límite"
            value={filters.maxAgeHours}
            min={0}
            onChange={(v) => onFiltersChange({ ...filters, maxAgeHours: v })}
          />

          <NumberField
            label="Volumen mínimo diario"
            placeholder="sin mínimo"
            value={filters.minVolume}
            min={0}
            onChange={(v) => onFiltersChange({ ...filters, minVolume: v })}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CitySection({
  title,
  cities,
  selected,
  onToggle,
  extra,
}: {
  title: string;
  cities: readonly Location[];
  selected: Location[];
  onToggle: (city: Location, checked: boolean) => void;
  extra?: { label: string; checked: boolean; onToggle: (checked: boolean) => void; note: string };
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {cities.map((city) => (
          <label key={city} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={selected.includes(city)} onCheckedChange={(c) => onToggle(city, c === true)} />
            {city}
          </label>
        ))}
      </div>
      {extra && (
        <div className="mt-2 rounded-md border border-border px-3 py-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={extra.checked} onCheckedChange={(c) => extra.onToggle(c === true)} />
            {extra.label}
          </label>
          <p className="mt-1 text-xs text-muted-foreground">{extra.note}</p>
        </div>
      )}
    </div>
  );
}

const QUALITY_LABELS = ["Q1 Normal", "Q2 Bueno", "Q3 Excepcional", "Q4 Excelente", "Q5 Obra maestra"];

function QualityWeightsField({
  weights,
  onChange,
}: {
  weights: readonly number[];
  onChange: (weights: number[]) => void;
}) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  return (
    <div>
      <Label className="mb-1.5 block">Distribución de calidad al craftear (%)</Label>
      <p className="mb-2 text-xs text-muted-foreground">
        Por defecto son los pesos base del juego para foco/comida/nodos en cero (68.9/25/5/1/0.1%) -- la función real
        con la que suben no está publicada. La estación de crafteo SÍ te muestra tus porcentajes exactos (ícono de
        info cerca del toggle de foco, o al pasar el mouse sobre la barra de calidades) -- cargalos acá para tu spec
        y comida actuales.
      </p>
      <div className="grid grid-cols-5 gap-2">
        {QUALITY_LABELS.map((label, i) => (
          <div key={label}>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              value={Math.round(weights[i] * 1000) / 10}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                if (Number.isNaN(parsed)) return;
                const next = [...weights];
                next[i] = parsed / 100;
                onChange(next);
              }}
            />
            <p className="mt-1 text-center text-[11px] text-muted-foreground">{label.split(" ")[0]}</p>
          </div>
        ))}
      </div>
      {Math.abs(total - 1) > 0.01 && (
        <p className="mt-1 text-xs text-muted-foreground">Suma actual: {Math.round(total * 100)}% (no hace falta que sea 100%).</p>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(null);
            return;
          }
          const parsed = Number(raw);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
      />
    </div>
  );
}
