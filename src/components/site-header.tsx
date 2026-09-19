"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { Logo } from "@/components/logo";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { REAL_CITIES, type Location } from "@/lib/aodp/cities";
import { CITY_THEMES, type CityTheme } from "@/lib/city-theme";
import type { CitySpecialty } from "@/lib/city-specialties";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/es", label: "Inicio", count: null },
  { href: "/es/alquimia", label: "Alquimia", count: 174 },
  { href: "/es/refinado", label: "Refinado", count: 115 },
  { href: "/es/cocina", label: "Cocina", count: 183 },
  { href: "/es/equipo", label: "Equipo", count: 5711 },
  { href: "/es/monturas", label: "Monturas", count: 29 },
  { href: "/es/calculadora", label: "Calculadora", count: null },
  { href: "/es/sesiones", label: "Sesiones", count: null },
] as const;

const BONUS_LABEL: Record<CitySpecialty["kind"], string> = {
  crafting: "+15% crafteo",
  refining: "+40% refinado",
  meat: "+10% carne",
};

function formatCount(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n);
}

function isActive(pathname: string | null, href: string): boolean {
  return href === "/es" ? pathname === "/es" : (pathname?.startsWith(href) ?? false);
}

/** The one header shared by the home page and all four ranked-list pages. The nav (logo, tabs,
 * "Entrar con Discord" button) is always the same; `title`/`description` and `recipeControls` are opt-in
 * so only the ranked-list pages render the page-title block and the city/server selectors. */
export function SiteHeader({
  title,
  description,
  bleed = false,
  recipeControls,
}: {
  title?: string;
  description?: string;
  /** True on the ranked-list pages, whose `<main>` has zero padding and no `max-w-6xl` of its own
   * (that container is `max-w-[1600px]` on `<main>` itself) -- the header just needs its own
   * small inset for text, nothing to escape. False on the home page, which needs its own
   * `max-w-6xl` centering since `<main>` there is unconstrained. */
  bleed?: boolean;
  recipeControls?: {
    craftCity: Location;
    onCraftCityChange: (city: Location) => void;
    cityBonuses: Map<Location, CitySpecialty>;
  };
}) {
  const pathname = usePathname();
  const currentTheme = recipeControls ? CITY_THEMES[recipeControls.craftCity] : null;
  const [menuOpen, setMenuOpen] = useState(false);

  // The mobile menu opens fresh on every navigation instead of staying open across the route
  // change it just triggered.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Horizontal padding/max-width is shared by the sticky nav strip and the (non-sticky) title
  // block below it, so both line up with each other and with the rest of the page's content --
  // zero on the ranked-list pages, whose `<main>` is edge-to-edge by design (the breathing room
  // there lives in the gap between the filters sidebar and the table, not around the outside).
  const containerClasses = bleed ? "px-3 sm:px-0" : "mx-auto max-w-6xl px-3 sm:px-6 lg:px-8";

  return (
    <header>
      {/* Only the nav strip is sticky -- the page title/description scroll away normally, so the
       * permanent chrome tax on a dense, virtualized ranked-list page stays to the nav's own
       * height instead of the whole title block (see /impeccable layout finding). */}
      <div className="sticky top-0 z-20 border-b-2 border-double border-money/30 bg-background/90 backdrop-blur-md">
        <div className={cn(containerClasses, "py-3 sm:py-4")}>
          <nav className={cn("flex items-center gap-2 text-xs", !title && "gap-3 text-sm")}>
            <Link href="/es" className="mr-2 flex shrink-0 items-center gap-2.5 font-medium text-foreground hover:text-money">
              <Logo size={title ? 44 : 52} className={title ? "h-9 w-9 sm:h-11 sm:w-11" : "h-10 w-10 sm:h-13 sm:w-13"} />
              <span className="hidden font-display text-xl tracking-wide sm:inline sm:text-2xl">PlataRank</span>
            </Link>

        <div className="hidden min-w-0 flex-1 items-center gap-1.5 lg:flex">
          {NAV_ITEMS.map((item) => (
            <NavTab key={item.href} href={item.href} label={item.label} count={item.count} active={isActive(pathname, item.href)} />
          ))}
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label="Abrir menú"
                className="relative ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border text-foreground after:absolute after:-inset-2 after:content-[''] lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
            }
          />
          <SheetContent side="left" className="border-r-2 border-double border-money/30">
            <SheetHeader>
              <SheetTitle className="font-display text-base uppercase tracking-wide">PlataRank</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4 pb-4">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm transition-colors",
                      active ? "bg-money/10 text-money" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                    )}
                  >
                    {item.label}
                    {item.count !== null && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-px font-mono text-xs tabular-nums",
                          active ? "bg-money/20 text-money" : "bg-background/60 text-muted-foreground",
                        )}
                      >
                        {formatCount(item.count)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {recipeControls && currentTheme ? (
          <div className="ml-2 flex shrink-0 items-center gap-1.5">
            <div className="hidden sm:block">
              <ServerBadge />
            </div>

            <Select
              value={recipeControls.craftCity}
              onValueChange={(city) => recipeControls.onCraftCityChange(city as Location)}
            >
              <SelectTrigger
                className={cn(
                  "relative h-auto shrink-0 gap-1.5 rounded-md border px-2 py-1 text-xs after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] [&_svg:not([class*='size-'])]:size-3.5",
                  currentTheme.border,
                  currentTheme.bg,
                  currentTheme.text,
                )}
              >
                <CityGlyph theme={currentTheme} />
                <span className="font-medium">{recipeControls.craftCity}</span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </SelectTrigger>
              <SelectContent align="end" alignItemWithTrigger={false} className="min-w-56">
                {REAL_CITIES.map((city) => {
                  const theme = CITY_THEMES[city];
                  const bonus = recipeControls.cityBonuses.get(city);
                  return (
                    <SelectItem key={city} value={city} className="gap-2 py-1.5">
                      <CityGlyph theme={theme} />
                      <span className="flex-1">{city}</span>
                      {bonus && (
                        <span className="shrink-0 rounded-full bg-money/10 px-1.5 py-0.5 font-mono text-xs tabular-nums text-money">
                          {BONUS_LABEL[bonus.kind]}
                        </span>
                      )}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <div className="hidden sm:block">
              <AuthButton />
            </div>
          </div>
        ) : (
          <div className="ml-2 hidden sm:block">
            <AuthButton />
          </div>
            )}
          </nav>
        </div>
      </div>
      {title && (
        <div className={cn(containerClasses, "pt-3 pb-4 sm:pt-4")}>
          <h1 className="font-display text-xl uppercase tracking-tight sm:text-2xl">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
    </header>
  );
}

/** The city selector's badge: the emblem area of the city's standalone banner image, the fallback
 * glyph for Black Market, or nothing for Brecilien (no banner -- no substitute logo, per the Faction
 * Banner Rule). Each banner is a tall wooden standard (plaque + flag + pointed tail, natural
 * 410x962) with the colored emblem centered around (205, 470); the badge zooms into a ~300px square
 * there instead of squashing the whole flag into a square. */
const BANNER_WIDTH = 410;
const BANNER_HEIGHT = 962;
const EMBLEM_CENTER_X = 205;
const EMBLEM_CENTER_Y = 470;
const EMBLEM_SPAN = 300;
const BADGE_PX = 20; // matches h-5 w-5

export function CityGlyph({ theme }: { theme: CityTheme }) {
  if (!theme.banner && !theme.Icon) return null;
  const scale = BADGE_PX / EMBLEM_SPAN;
  return (
    <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded border border-current/40 bg-black/30">
      {theme.banner ? (
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${theme.banner})`,
            backgroundSize: `${BANNER_WIDTH * scale}px ${BANNER_HEIGHT * scale}px`,
            backgroundPosition: `${-(EMBLEM_CENTER_X * scale - BADGE_PX / 2)}px ${-(EMBLEM_CENTER_Y * scale - BADGE_PX / 2)}px`,
            backgroundRepeat: "no-repeat",
          }}
        />
      ) : theme.Icon ? (
        <theme.Icon className="h-full w-full p-0.5" />
      ) : null}
    </span>
  );
}

/** Server is a real, load-bearing choice (which AODP region the data comes from), but only
 * Americas has ingested data today (see PRODUCT.md) -- Europe/Asia are shown, disabled, rather
 * than hidden, so the control is honest about what exists without pretending it works. */
function ServerBadge() {
  return (
    <Select value="americas" onValueChange={() => {}}>
      <SelectTrigger className="relative h-auto shrink-0 gap-1.5 rounded-md border-border bg-secondary/40 px-2 py-1 text-xs text-muted-foreground after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']">
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

function NavTab({ href, label, count, active }: { href: string; label: string; count: number | null; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex shrink-0 items-center gap-1.5 rounded-t-sm border-b-2 px-2.5 py-1 text-xs transition-colors after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']",
        active
          ? "border-money text-money"
          : "border-transparent text-muted-foreground hover:border-money/30 hover:text-foreground",
      )}
    >
      {label}
      {count !== null && (
        <span
          className={cn(
            "rounded-full px-1.5 py-px font-mono text-xs tabular-nums",
            active ? "bg-money/20 text-money" : "bg-background/60 text-muted-foreground",
          )}
        >
          {formatCount(count)}
        </span>
      )}
    </Link>
  );
}
