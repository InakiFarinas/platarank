---
name: PlataRank
description: Dark trading-floor ticker for Albion Online alchemy recipes, ranked by realizable silver/day.
colors:
  operate-ground: "oklch(0.14 0.003 285)"
  card-surface: "oklch(0.19 0.004 285)"
  foreground: "oklch(0.94 0.003 285)"
  muted-surface: "oklch(0.23 0.004 285)"
  muted-foreground: "oklch(0.62 0.006 285)"
  hairline-border: "oklch(1 0 0 / 8%)"
  secondary-surface: "oklch(0.25 0.004 285)"
  money-amber: "oklch(0.78 0.16 68)"
  money-foreground: "oklch(0.145 0 0)"
typography:
  headline:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.01em"
  tabular:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontFeature: "tabular-nums"
  panel-title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  full: "9999px"
spacing:
  row-x: "12px"
  row-y: "10px"
  container-x-mobile: "12px"
  container-x-desktop: "24px"
  container-y-mobile: "16px"
  container-y-desktop: "32px"
  gap-sm: "8px"
  gap-md: "16px"
  gap-lg: "24px"
components:
  row-item:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    padding: "10px 12px"
  row-item-hover:
    backgroundColor: "color-mix(in oklch, {colors.secondary-surface} 40%, transparent)"
  row-detail:
    backgroundColor: "color-mix(in oklch, {colors.card-surface} 50%, transparent)"
    textColor: "{colors.muted-foreground}"
    padding: "12px 12px"
  sort-chip-active:
    backgroundColor: "color-mix(in oklch, {colors.money-amber} 10%, transparent)"
    textColor: "{colors.money-amber}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  sort-chip-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-tier:
    backgroundColor: "{colors.secondary-surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    typography: "{typography.tabular}"
---

# Design System: PlataRank

## Overview

**Creative North Star: "The Operate-Mode Trading Ticker"**

PlataRank is a single-purpose Operate surface, not a marketing page: a near-black ground read one-handed next to the game, where the only color statement is a warm amber reserved for the number that matters. The build confirms the direction contract's thesis exactly -- plata/dia renders as the largest, only-colored figure in each row (`text-money`, `font-mono`, `text-base sm:text-lg font-semibold`), while margin and volume sit as small muted stats stacked beside it. There is no hero, no marketing copy, no light mode: `<html class="dark">` is hardcoded in the root layout, confirming dark-only is a real product decision, not a default left unconfigured.

Density and legibility drive every layout call: hairline borders instead of shadows, a virtualized row list tuned to a 52px estimate, and tabular-nums monospace on every number so columns hold their alignment while scrolling fast on a phone. The system does not reach for icons, badges, or color to create hierarchy where restraint already does the job -- the one amber accent is rationed to two roles and never leaks into buttons or navigation.

**Key Characteristics:**
- Dark-only "Operate ground" -- no light theme exists or is planned.
- One accent color, two jobs: the plata/dia figure and active sort state. Nothing else uses it.
- Tabular-nums monospace on every numeric value; proportional sans on every label.
- Zero shadows; hairline borders and tonal surface steps carry all separation.
- Dense, mobile-first row rhythm with an expandable inline detail panel per row.

## Colors

A near-black neutral scale (OKLCH, low chroma, cool-neutral hue ~285) with a single warm amber accent lifted straight from Albion's own silver-coin color, not a generic SaaS blue.

### Primary
- **Money Amber** (`oklch(0.78 0.16 68)`): reserved for exactly two things -- the plata/dia figure (the row's largest, boldest number) and the active sort state (desktop `SortHeader` label color, mobile `MobileSortChip` border/background/text). Also drives `:focus-visible` outlines and the text-selection tint. It does not appear on any button, badge, or navigation element.

### Neutral
- **Operate Ground** (`oklch(0.14 0.003 285)`): page background.
- **Card Surface** (`oklch(0.19 0.004 285)`): row-detail panel background (used at 50% opacity), popover/card surfaces.
- **Secondary Surface** (`oklch(0.25 0.004 285)`): tier badges, row hover state (`hover:bg-accent/40`), sort-chip inactive backgrounds.
- **Foreground** (`oklch(0.94 0.003 285)`): primary text.
- **Muted Foreground** (`oklch(0.62 0.006 285)`): secondary stats, labels, timestamps, inactive sort icons.
- **Hairline Border** (`oklch(1 0 0 / 8%)`): the only separator device in the system -- every row, header, and container edge.

### Named Rules
**The One Amber Rule.** The accent is rationed to the plata/dia figure and active sort state. A retry button, a badge, or a nav item never carries it -- confirmed by the error page's retry button, which uses a plain hairline border and `hover:bg-accent`, not the money color.

## Typography

**Body/Label Font:** Geist Sans (system-ui, sans-serif fallback) -- the shadcn default workhorse sans, not a display face.
**Tabular/Mono Font:** Geist Mono (ui-monospace fallback), applied with `tabular-nums` to every numeric value.

**Character:** A quiet, utilitarian pairing. The sans carries labels and prose; the mono exists purely to make numbers scan and align in a dense table, never for decorative effect.

### Hierarchy
- **Headline** (600, 1.125rem/1.25rem responsive, tight tracking): the page title only ("Alquimia -- Americas").
- **Body** (400, 0.875rem): the page subtitle, row detail section prose, error/loading copy.
- **Tabular** (mono, ~0.8125rem, `tabular-nums`): every numeric cell -- rank, margin %, volume, quality score, plata/dia, and every derivation-panel figure (prices, fees, costs).
- **Label** (400, 0.6875rem/11px, slight tracking): column headers, stat captions ("margen", "vol/dia", "plata/dia"), sort-bar caption.
- **Panel title** (600, 0.875rem, body size at headline weight): titles of secondary surfaces that aren't the page itself -- e.g. the Filtros Sheet's "Filtros y supuestos". Distinct from Headline (reserved for the page `<h1>`) so a panel never visually competes with the page title.

### Named Rules
**The Tabular-Nums Rule.** Any value that is a quantity (silver, percent, count, score) renders in mono with `tabular-nums`; any value that is a label or name renders in the proportional sans. Never mix the two roles for legibility's sake.

## Layout

Mobile-first, single-column container (`max-w-5xl`, centered), with padding that scales from dense mobile (`px-3 py-4`) to a slightly looser desktop (`sm:px-6 sm:py-8`). The table itself is the first viewport -- no hero.

**Sticky header pattern.** The page title block is `sticky top-0 z-20`, bleeds edge-to-edge via negative margin (`-mx-3 sm:-mx-6`) then re-pads, and sits on `bg-background/95` with `backdrop-blur` so content scrolls underneath a legible, non-opaque title bar. This is the standard header treatment for any Operate-mode page in this project.

**Row density.** Rows are dense by design: `py-2.5` on mobile collapsing to `py-2` on desktop, virtualized at a 52px row-height estimate so hundreds of recipes scan fast on a phone.

**Responsive control fallback.** Sort controls have two forms, not one degraded into the other: a `hidden sm:flex` inline header row of text+icon sort buttons for desktop, and a `sm:hidden` horizontally-scrollable pill/chip bar for mobile.

**Exception, documented (Fase 2 Filtros panel):** the city/market-share/focus/rate/filter controls do NOT follow the split above. There are 15+ discrete inputs (7 buy-city checkboxes, 7 sell-city checkboxes + Black Market, a switch, two number fields, two filter fields) -- too many for a chip bar at any breakpoint, and splitting them into a different desktop-vs-mobile layout would mean maintaining two control arrangements for the same form. Instead: one `Sheet` (bottom-anchored on every breakpoint) triggered by a single "Filtros" button, identical on mobile and desktop. Keep this as the pattern for any future control set this size; the header-row/chip-bar split stays reserved for simple 3-5-option controls like sort.

**Row content reflow.** On mobile, secondary stats (margin, volume) stack below/beside the name in a tighter cluster; on desktop they spread into a horizontal stat row. The plata/dia figure and quality bar keep their position and size across breakpoints -- they are the visual anchor at every width.

## Elevation & Depth

Flat. No shadows anywhere in the build (`box-shadow` is absent from every component reviewed). Depth is conveyed entirely through hairline borders (`border-border`, 8%-opacity white) and tonal surface steps (ground -> card -> secondary-surface, each a small lightness step in the same low-chroma hue). The expandable row detail is distinguished from its parent row only by a translucent card-tint background (`bg-card/50`), not a shadow or outline.

### Named Rules
**The No-Shadow Rule.** Elevation is never simulated with `box-shadow`. Use a border and/or the next tonal surface step instead. Applies to overlays too: the Filtros `Sheet` sits on `bg-popover` with a single hairline `border-t` where it meets the page, `shadow-lg` stripped from the shadcn default in `ui/sheet.tsx`.

## Shapes

Two radius vocabularies, used consistently: **soft-rectangular** (`rounded-md`, ~8px) for containers -- the table wrapper, tier badges, loading skeletons -- and **full pill** (`rounded-full`) for anything representing a toggleable/measured state -- sort chips, the quality-score bar track and fill, the scrollbar thumb. Borders are always hairline (1px, 8% white); there is no double-border or thick-stroke treatment anywhere in the build.

## Components

### Row + Expandable Detail (signature component)
The core interaction pattern of the whole surface. Each recipe is a full-width `<button>` row (rank, name + tier/ench badge, stats, plata/dia) that toggles an inline detail panel on click -- no navigation, no modal. A `ChevronDown` icon rotates 180deg to indicate open state. The detail panel (`bg-card/50`, two-column grid on desktop, single column on mobile) exposes the full derivation: price source, city count, data age, Brecilien coverage, quality score, return rate, station fee, every material's cost contribution, and every discarded outlier with its reason. This is the product's "receipt one tap away" promise made structural, not decorative -- any future ranked-list surface (Fase 3 station types) should reuse this exact row/detail split rather than a separate details page.

### Quality Bar
A thin horizontal bar (`h-1.5 w-10`, `rounded-full` track in muted, filled proportionally to score) paired with the raw numeric score in mono, wrapped in a tooltip that explains city coverage and Brecilien status on hover/focus. Fill color is amber when score >= 60, muted-foreground otherwise -- it is a signal-strength meter, never a pass/fail badge or traffic-light. Do not replace this with a colored status badge; the bar-chart-as-chip is the confirmed pattern.

### Sort Controls
Desktop: inline text+icon buttons in the table header row (`ArrowUp`/`ArrowDown`/`ArrowUpDown` from lucide), active state colored amber. Mobile: a horizontally-scrollable row of full-pill chips with a border, same icon logic, active state gets an amber border/background tint/text. Both forms toggle the same sort state and always default to descending on first select.

### Badges
Stock shadcn `Badge`, used narrowly: `secondary` variant for the tier/enchant tag (`T4.2`, mono tabular numerals), `outline` variant for the "datos insuficientes" (insufficient data) flag. Never used as a quality or status indicator -- that role belongs to the Quality Bar.

### Buttons
Only two button treatments appear in the build: the plain-bordered retry button on the error page (`rounded-md border border-border`, `hover:bg-accent`, no accent color) and the row/chip buttons described above. There is no filled primary-amber button anywhere -- confirming the One Amber Rule extends to interactive controls, not just static figures.

## Do's and Don'ts

### Do:
- **Do** reserve the money-amber accent for realized/ranked silver figures and active sort/filter state only.
- **Do** render every quantity (price, percent, count, score) in mono with `tabular-nums`; render every name/label in proportional sans.
- **Do** use hairline borders and tonal surface steps for separation and depth; never a shadow.
- **Do** pair any new sortable/filterable control with both a desktop inline-header form and a mobile chip-bar form, per the confirmed responsive split.
- **Do** keep new ranked-list surfaces (Fase 2 city controls, Fase 3 station types) on the row + expandable-detail pattern rather than introducing a details page or modal.

### Don't:
- **Don't** introduce a light theme variant; dark-only is a confirmed product decision (`<html class="dark">` is hardcoded), not an unfinished default.
- **Don't** render a data-quality or confidence score as a colored badge or traffic-light; the thin horizontal bar is the system's only quality-signal device.
- **Don't** spread the amber accent onto buttons, nav, or non-ranking UI -- it stays rationed to the two roles above.
- **Don't** add box-shadows for elevation; step to the next tonal surface or add a hairline border instead.
