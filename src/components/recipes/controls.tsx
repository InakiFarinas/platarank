"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  stationType: "alchemy" | "refining";
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
          <Button variant="outline" size="sm" className="gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </Button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros y supuestos</SheetTitle>
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

          {stationType === "refining" && (
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="refining-specialty-switch">Especialidad de refinado</Label>
                <p className="text-xs text-muted-foreground">
                  +40% de retorno -- activalo si refinás en la ciudad con especialidad para este recurso.
                </p>
              </div>
              <Switch
                id="refining-specialty-switch"
                checked={params.refiningSpecialty}
                onCheckedChange={(checked) => onParamsChange({ ...params, refiningSpecialty: checked })}
              />
            </div>
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
