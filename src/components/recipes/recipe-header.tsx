"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { WaxSeal } from "@/components/icons/wax-seal";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { CITY_THEMES } from "@/lib/city-theme";
import type { CitySpecialty } from "@/lib/city-specialties";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/es/alquimia", label: "Alquimia" },
  { href: "/es/refinado", label: "Refinado" },
  { href: "/es/cocina", label: "Cocina" },
  { href: "/es/equipo", label: "Equipo" },
] as const;

const BONUS_LABEL: Record<CitySpecialty["kind"], string> = {
  crafting: "+15% crafteo",
  refining: "+40% refinado",
  meat: "+10% carne",
};

export function RecipeHeader({
  title,
  description,
  craftCity,
  onCraftCityChange,
  cityBonuses,
}: {
  title: string;
  description: string;
  craftCity: Location;
  onCraftCityChange: (city: Location) => void;
  cityBonuses: Map<Location, CitySpecialty>;
}) {
  const pathname = usePathname();
  const currentTheme = CITY_THEMES[craftCity];
  const CurrentIcon = currentTheme.Icon;

  return (
    <header className="sticky top-0 z-20 -mx-3 mb-4 border-b-2 border-double border-border bg-background/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:mb-6 sm:px-6">
      <nav className="mb-2.5 flex items-center gap-1 text-xs">
        <Link href="/es" className="mr-2 flex shrink-0 items-center gap-1.5 font-medium text-foreground hover:text-money">
          <WaxSeal className="h-3.5 w-3.5 text-money" />
          <span className="hidden sm:inline">PlataRank</span>
        </Link>

        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false;
            return <RubroTab key={item.href} href={item.href} label={item.label} active={active} />;
          })}
        </div>

        <Select value={craftCity} onValueChange={(city) => onCraftCityChange(city as Location)}>
          <SelectTrigger
            className={cn(
              "ml-2 h-auto shrink-0 gap-1.5 rounded-md border px-2 py-1 text-xs [&_svg:not([class*='size-'])]:size-3.5",
              currentTheme.border,
              currentTheme.bg,
              currentTheme.text,
            )}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-current/40 bg-black/30 p-0.5">
              <CurrentIcon className="h-full w-full" />
            </span>
            <span className="font-medium">{craftCity}</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </SelectTrigger>
          <SelectContent align="end" alignItemWithTrigger={false} className="min-w-56">
            {REAL_CITIES.map((city) => {
              const theme = CITY_THEMES[city];
              const Icon = theme.Icon;
              const bonus = cityBonuses.get(city);
              return (
                <SelectItem key={city} value={city} className="gap-2 py-1.5">
                  <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border p-0.5", theme.border, theme.bg, theme.text)}>
                    <Icon className="h-full w-full" />
                  </span>
                  <span className="flex-1">{city}</span>
                  {bonus && (
                    <span className="shrink-0 rounded-full bg-money/10 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-money">
                      {BONUS_LABEL[bonus.kind]}
                    </span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </nav>
      <h1 className="font-heading text-xl tracking-tight sm:text-2xl">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

function RubroTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors",
        active ? "bg-money/10 text-money" : "bg-secondary/40 text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
