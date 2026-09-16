"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { WaxSeal } from "@/components/icons/wax-seal";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { CITY_THEMES } from "@/lib/city-theme";
import type { CitySpecialty } from "@/lib/city-specialties";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/es/alquimia", label: "Alquimia", count: 174 },
  { href: "/es/refinado", label: "Refinado", count: 115 },
  { href: "/es/cocina", label: "Cocina", count: 183 },
  { href: "/es/equipo", label: "Equipo", count: 5632 },
] as const;

const BONUS_LABEL: Record<CitySpecialty["kind"], string> = {
  crafting: "+15% crafteo",
  refining: "+40% refinado",
  meat: "+10% carne",
};

function formatCount(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n);
}

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
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  // The rubro nav can overflow on mobile; without this the active tab (the one piece of chrome
  // whose job is confirming "you're here") can land scrolled out of view with no affordance that
  // more tabs exist.
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 -mx-3 mb-4 border-b-2 border-double border-money/30 bg-background/90 px-3 py-3 backdrop-blur-md sm:-mx-6 sm:mb-6 sm:px-6 lg:-mx-8">
      <nav className="mb-2.5 flex items-center gap-1.5 text-xs">
        <Link href="/es" className="mr-2 flex shrink-0 items-center gap-2 font-medium text-foreground hover:text-money">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-money/40 bg-money/10 p-1">
            <WaxSeal className="h-full w-full text-money" />
          </span>
          <span className="hidden font-heading text-base sm:inline">PlataRank</span>
        </Link>

        <div className="flex flex-1 items-center gap-1.5 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href) ?? false;
            return (
              <RubroTab
                key={item.href}
                ref={active ? activeTabRef : undefined}
                href={item.href}
                label={item.label}
                count={item.count}
                active={active}
              />
            );
          })}
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1.5">
          <div className="hidden sm:block">
            <ServerBadge />
          </div>

          <Select value={craftCity} onValueChange={(city) => onCraftCityChange(city as Location)}>
            <SelectTrigger
              className={cn(
                "relative h-auto shrink-0 gap-1.5 rounded-md border px-2 py-1 text-xs after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] [&_svg:not([class*='size-'])]:size-3.5",
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
                    <span
                      className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border p-0.5", theme.border, theme.bg, theme.text)}
                    >
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
        </div>
      </nav>
      <h1 className="font-heading text-xl tracking-tight sm:text-2xl">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

/** Server is a real, load-bearing choice (which AODP region the data comes from), but only
 * Americas has ingested data today (see PRODUCT.md) -- Europe/Asia are shown, disabled, rather
 * than hidden, so the control is honest about what exists without pretending it works. */
function ServerBadge() {
  return (
    <Select value="americas" onValueChange={() => {}}>
      <SelectTrigger className="h-auto shrink-0 gap-1.5 rounded-md border-border bg-secondary/40 px-2 py-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Americas</span>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="americas">Americas</SelectItem>
        <SelectItem value="europe" disabled>
          Europe (sin datos todavía)
        </SelectItem>
        <SelectItem value="asia" disabled>
          Asia (sin datos todavía)
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

const RubroTab = forwardRef<HTMLAnchorElement, { href: string; label: string; count: number; active: boolean }>(function RubroTab(
  { href, label, count, active },
  ref,
) {
  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
        active
          ? "border-money/50 bg-money/10 text-money"
          : "border-transparent bg-secondary/40 text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-px font-mono text-[11px] tabular-nums",
          active ? "bg-money/20 text-money" : "bg-background/60 text-muted-foreground",
        )}
      >
        {formatCount(count)}
      </span>
    </Link>
  );
});
