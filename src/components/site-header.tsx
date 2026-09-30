"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { ChevronDown, Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AuthButton } from "@/components/auth-button";
import { LanguageSwitch } from "@/components/language-switch";
import { localePath, type Locale, type RouteKey } from "@/i18n/config";
import { Logo } from "@/components/logo";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { CityTheme } from "@/lib/city-theme";
import { cn } from "@/lib/utils";

type NavItem = { route?: RouteKey; label: string; count: number | null };

const CRAFT_ITEMS: readonly { route: RouteKey; count: number | null }[] = [
  { route: "alchemy", count: 174 },
  { route: "refining", count: 115 },
  { route: "cooking", count: 183 },
  { route: "gear", count: 5711 },
  { route: "mounts", count: 29 },
];

function formatCount(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n);
}

function isActive(pathname: string | null, href: string, locale: Locale): boolean {
  return href === localePath(locale) ? pathname === href : (pathname?.startsWith(href) ?? false);
}

type NavEntry = NavItem & { href: string };

/** Nav entries with their locale-resolved href and translated label. */
function useNav() {
  const locale = useLocale() as Locale;
  const t = useTranslations("common.nav");
  const entry = (route: RouteKey | undefined, label: string, count: number | null = null): NavEntry => ({ route, label, count, href: localePath(locale, route) });
  return {
    locale,
    before: [entry(undefined, t("home"))],
    craft: CRAFT_ITEMS.map((i) => entry(i.route, t(i.route), i.count)),
    // Artefactos is a materially different tool (no silver/day ranking, no derivation panel --
    // see /impeccable critique 2026-09-30), so it gets its own top-level slot instead of sitting
    // inside "Crafteo" alongside the 5 ranked rubros it doesn't work like.
    after: [entry("artifacts", t("artifacts")), entry("calculator", t("calculator"))],
  };
}

/** The one header shared by the home page and all four ranked-list pages. The nav (logo, tabs,
 * "Entrar con Discord" button) is always the same; `title`/`description` are opt-in so only the
 * ranked-list pages render the page-title block. The "ciudad donde craftea" selector used to live
 * here too; it moved into the Filtros panel (controls.tsx) so it sits next to the other crafting
 * assumptions instead of competing with the nav for space. */
export function SiteHeader({
  title,
  description,
  bleed = false,
  showServerBadge = false,
}: {
  title?: string;
  description?: string;
  /** True on the ranked-list pages, whose `<main>` has zero padding and no `max-w-6xl` of its own
   * (that container is `max-w-[1600px]` on `<main>` itself) -- the header just needs its own
   * small inset for text, nothing to escape. False on the home page, which needs its own
   * `max-w-6xl` centering since `<main>` there is unconstrained. */
  bleed?: boolean;
  /** Only the ranked-list pages care which AODP region the data comes from. */
  showServerBadge?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("common");
  const { locale, before, craft, after } = useNav();

  // The mobile menu opens fresh on every navigation instead of staying open across the route
  // change it just triggered.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Horizontal padding/max-width is shared by the sticky nav strip and the (non-sticky) title
  // block below it, so both line up with each other and with the rest of the page's content --
  // on the ranked-list pages the header sits inside `<main>`'s own `max-w-[1600px]`, so it needs
  // its own centering to match that width, plus the same padding `<main>` uses. The gutter itself
  // stays at every width (not just mobile) -- `sm:px-0` used to zero it out past 640px, pinning
  // the logo and nav flush to the browser edge on every laptop/desktop width below 1600px.
  const containerClasses = bleed ? "mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-8" : "mx-auto max-w-6xl px-3 sm:px-6 lg:px-8";

  return (
    <header>
      {/* Only the nav strip is sticky -- the page title/description scroll away normally, so the
       * permanent chrome tax on a dense, virtualized ranked-list page stays to the nav's own
       * height instead of the whole title block (see /impeccable layout finding). On the
       * ranked-list pages this bar lives inside `<main>`'s `max-w-[1600px]`, so it's broken out to
       * full viewport width here (the trick works regardless of ancestor width) and the width is
       * reapplied to its content via `containerClasses` above, so the bar's background/border spans
       * edge to edge like it does on the pages where the header is a sibling of `<main>`. */}
      <div
        className={cn(
          "sticky top-0 z-20 border-b-2 border-double border-money/30 bg-background/90 backdrop-blur-md",
          bleed && "ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen",
        )}
      >
        <div className={cn(containerClasses, "py-3 sm:py-4")}>
          <nav className={cn("flex items-center gap-2 text-xs", !title && "gap-3 text-sm")}>
            <Link href={localePath(locale)} aria-label="PlataRank" className="mr-2 flex shrink-0 items-center gap-2.5 font-medium text-foreground hover:text-money">
              <Logo size={title ? 44 : 52} className={title ? "h-9 w-9 sm:h-11 sm:w-11" : "h-10 w-10 sm:h-13 sm:w-13"} />
              <span className="font-display text-sm tracking-wide sm:text-xl lg:text-2xl">PlataRank</span>
            </Link>

        <div className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          {before.map((item) => (
            <NavTab key={item.href} href={item.href} label={item.label} count={item.count} active={isActive(pathname, item.href, locale)} />
          ))}
          <CraftMenu pathname={pathname} items={craft} locale={locale} label={t("nav.craft")} />
          {after.map((item) => (
            <NavTab key={item.href} href={item.href} label={item.label} count={item.count} active={isActive(pathname, item.href, locale)} />
          ))}
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label={t("nav.openMenu")}
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
              {before.map((item) => (
                <MobileLink key={item.href} item={item} active={isActive(pathname, item.href, locale)} />
              ))}
              <p className="px-3 pt-3 pb-1 text-xs uppercase tracking-wide text-muted-foreground">{t("nav.craft")}</p>
              {craft.map((item) => (
                <MobileLink key={item.href} item={item} active={isActive(pathname, item.href, locale)} className="pl-6" />
              ))}
              <div className="pt-2" />
              {after.map((item) => (
                <MobileLink key={item.href} item={item} active={isActive(pathname, item.href, locale)} />
              ))}
            </nav>
            {/* AuthButton is `hidden sm:block` in the nav strip above -- the mobile Sheet is the
             * only sign-in entry point below that breakpoint, so it needs its own copy here
             * (see /impeccable audit 2026-09-30). */}
            <div className="border-t border-border px-4 pt-3 pb-4">
              <AuthButton />
            </div>
          </SheetContent>
        </Sheet>

        <div className="ml-2 flex shrink-0 items-center gap-1.5">
          {showServerBadge && (
            <div className="hidden sm:block">
              <ServerBadge />
            </div>
          )}
          <LanguageSwitch />
          <div className="hidden sm:block">
            <AuthButton />
          </div>
        </div>
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
  const t = useTranslations("common.server");
  return (
    <Select value="americas" onValueChange={() => {}}>
      <SelectTrigger aria-label={t("label")} className="relative h-auto shrink-0 gap-1.5 rounded-md border-border bg-secondary/40 px-2 py-1 text-xs text-muted-foreground after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']">
        <span className="font-medium text-foreground">Americas</span>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="americas">Americas</SelectItem>
        <SelectItem value="europe" disabled>
          Europe ({t("noData")})
        </SelectItem>
        <SelectItem value="asia" disabled>
          Asia ({t("noData")})
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

function MobileLink({ item, active, className }: { item: NavEntry; active: boolean; className?: string }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-sm transition-colors",
        active ? "bg-money/10 text-money" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
        className,
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
}

/** One "Crafteo" tab grouping every crafting category; active while any of them is the current page. */
function CraftMenu({ pathname, items, locale, label }: { pathname: string | null; items: readonly NavEntry[]; locale: Locale; label: string }) {
  const active = items.some((item) => isActive(pathname, item.href, locale));
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        className={cn(
          "relative flex shrink-0 items-center gap-1 rounded-t-sm border-b-2 px-2 py-1 text-xs transition-colors after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']",
          active ? "border-money text-money" : "border-transparent text-muted-foreground hover:border-money/30 hover:text-foreground",
        )}
      >
        {label}
        <ChevronDown className="h-3 w-3" />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner align="start" sideOffset={8} className="z-30">
          <MenuPrimitive.Popup className="min-w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground outline-none">
            {items.map((item) => {
              const itemActive = isActive(pathname, item.href, locale);
              return (
                <MenuPrimitive.LinkItem
                  key={item.href}
                  render={<Link href={item.href} aria-current={itemActive ? "page" : undefined} />}
                  className={cn(
                    "flex cursor-default items-center justify-between gap-3 rounded-sm px-2.5 py-1.5 text-xs outline-none data-[highlighted]:bg-accent/40",
                    itemActive ? "text-money" : "text-muted-foreground data-[highlighted]:text-foreground",
                  )}
                >
                  {item.label}
                  {item.count !== null && <span className="font-mono tabular-nums text-muted-foreground">{formatCount(item.count)}</span>}
                </MenuPrimitive.LinkItem>
              );
            })}
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

function NavTab({ href, label, count, active }: { href: string; label: string; count: number | null; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex shrink-0 items-center gap-1.5 rounded-t-sm border-b-2 px-2 py-1 text-xs transition-colors after:absolute after:-inset-y-2 after:inset-x-0 after:content-['']",
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
