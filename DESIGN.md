---
name: PlataRank
description: Dark guild-ledger noticeboard for Albion Online crafting recipes, ranked by realizable silver/day.
colors:
  guild-ground: "oklch(0.16 0.017 55)"
  ledger-card: "oklch(0.21 0.02 55)"
  parchment-ink: "oklch(0.92 0.018 75)"
  secondary-surface: "oklch(0.27 0.022 55)"
  muted-surface: "oklch(0.24 0.02 55)"
  muted-foreground: "oklch(0.67 0.03 65)"
  hairline-border: "oklch(0.8 0.04 65 / 13%)"
  coin-gold: "oklch(0.78 0.16 68)"
  coin-gold-foreground: "oklch(0.16 0.02 60)"
typography:
  headline:
    fontFamily: "IM Fell English, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  panel-title:
    fontFamily: "IM Fell English, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.4
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
rounded:
  sm: "5px"
  md: "6px"
  lg: "8px"
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
    textColor: "{colors.parchment-ink}"
    padding: "10px 12px"
  row-item-hover:
    backgroundColor: "color-mix(in oklch, {colors.secondary-surface} 40%, transparent)"
  row-detail:
    backgroundColor: "color-mix(in oklch, {colors.ledger-card} 50%, transparent)"
    textColor: "{colors.muted-foreground}"
    padding: "12px 12px"
  sort-chip-active:
    backgroundColor: "color-mix(in oklch, {colors.coin-gold} 10%, transparent)"
    textColor: "{colors.coin-gold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  sort-chip-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-tier:
    backgroundColor: "{colors.secondary-surface}"
    textColor: "{colors.parchment-ink}"
    rounded: "{rounded.sm}"
    typography: "{typography.tabular}"
---

# Design System: PlataRank

## Overview

**Creative North Star: "The Guild Ledger"**

PlataRank stayed a single-purpose Operate surface -- dark, dense, read one-handed next to the game -- but its chrome was rebuilt as a merchant guild's account-hall noticeboard rather than a trading-floor ticker. The ground shifted from a cool near-black neutral (hue 285) to a warm, candlelit umber (hue ~55-75, OKLCH), and the sticky header, sort-bar dividers, and the home page's rubro divider all now carry a double ruled line (`border-double border-b-2` / `border-t-2`) standing in for a ledger's ruled hairline. IM Fell English, a legible period print face, now carries the page `<h1>` and panel titles (the Filtros Sheet's "Filtros y supuestos", the rubro card labels); Geist Sans keeps every body/label role and Geist Mono keeps every numeric value untouched -- a deliberate legibility call, not an oversight. A single hand-drawn wax-seal SVG mark (`WaxSeal`, one stroke weight, no fill gradients) sits beside the "PlataRank" wordmark in the nav and as the home page's masthead.

The world stops at the frame. The direction contract's thesis -- "ornament lives in chrome only, data rows stay exactly as dense/unadorned as before" -- holds in the build: the row list, its virtualization, the expandable derivation panel, badges, selects, sheets, and the Quality Bar's bar/track shape are byte-identical in structure to the prior world, restyled only through the same CSS custom properties. The one structural change inside a data row is additive, not decorative: illiquid quality-breakdown prices now carry `underline decoration-dashed decoration-muted-foreground underline-offset-4` alongside their existing reduced opacity, so stale/illiquid state reads even in grayscale or under color-blindness, not only through alpha.

Note on the direction contract's raise: the contract proposed the quality score become "a wax-seal ink-fill gauge, not a bar." That did not ship -- `QualityBadge`/the quality bar kept its exact prior bar-and-track shape; only its surrounding palette shifted. This DESIGN.md documents the bar as built, not the gauge as proposed.

**Key Characteristics:**
- Dark-only "guild ground" -- warm oak/umber (hue ~55-75), replacing the old cool-zinc neutral; no light theme exists or is planned.
- One accent color, unchanged in value, now doing double duty as coin-gold and wax-seal ink: reserved for the plata/dia figure and active sort state.
- IM Fell English carries headlines and panel titles only; Geist Sans stays on body/labels; Geist Mono stays untouched on every number.
- Double ruled hairlines (`border-double border-b-2`) mark every major chrome divider -- header, sort-bar, home-page rubro divider.
- Stale/illiquid data is now marked by line form (dashed underline) in addition to color/alpha, not by color alone.
- Data-row density, the row+expandable-detail interaction, and the Quality Bar's shape are unchanged from the prior world.

## Colors

A warm, low-to-mid-chroma umber/parchment scale (OKLCH, hue ~55-75, candlelit rather than screen-lit) with the same single coin-gold accent carried forward unchanged in value from the prior world.

### Primary
- **Coin Gold** (`oklch(0.78 0.16 68)`): reserved for exactly two things -- the plata/dia figure (the row's largest, boldest number) and the active sort state (desktop `SortHeader` label color, mobile `MobileSortChip` border/background/text). Also drives `:focus-visible` outlines, the text-selection tint, and the wax-seal icon fill. It does not appear on any button, badge, or navigation element beyond the wordmark mark.

### Neutral
- **Guild Ground** (`oklch(0.16 0.017 55)`): page background -- warm near-black umber, replacing the old cool-zinc `oklch(0.14 0.003 285)`.
- **Ledger Card** (`oklch(0.21 0.02 55)`): row-detail panel background (used at 50% opacity), popover/card surfaces.
- **Secondary Surface** (`oklch(0.27 0.022 55)`): tier badges, row hover state, sort-chip inactive backgrounds.
- **Parchment Ink** (`oklch(0.92 0.018 75)`): primary text -- warmer and slightly higher-chroma than the old cool-white foreground.
- **Muted Foreground** (`oklch(0.67 0.03 65)`): secondary stats, labels, timestamps, inactive sort icons.
- **Hairline Border** (`oklch(0.8 0.04 65 / 13%)`): sepia/bronze-tinted, the base separator device -- carried at 1px on ordinary row borders and doubled (`border-double border-b-2`) at the chrome dividers named by the Registration-Plate Rule below.

### Named Rules
**The One Coin Rule.** The accent is rationed to the plata/dia figure and active sort state (carried forward unchanged from the prior world). A retry button, a badge, or a nav item never carries it, except the single wax-seal wordmark mark.

**The Registration-Plate Rule.** Every major chrome divider is a deliberate ruled hairline, not a plain 1px rule: the sticky page header (`border-b-2 border-double`), the desktop and mobile sort-bar dividers in the table (`border-b-2 border-double`), and the home page's divider above the rubro grid (`border-t-2 border-double`). Ordinary row-to-row separators inside the table stay plain 1px hairlines -- the double rule is reserved for structural, once-per-surface dividers, not every seam.

## Typography

**Display/Heading Font:** IM Fell English (Georgia, serif fallback) -- a legible period print face, not a blackletter or display-fantasy face.
**Body/Label Font:** Geist Sans (system-ui, sans-serif fallback) -- unchanged from the prior world.
**Tabular/Mono Font:** Geist Mono (ui-monospace fallback), applied with `tabular-nums` to every numeric value -- unchanged from the prior world.

**Character:** A print/ledger heading paired with the same quiet utilitarian sans-and-mono body pairing as before. The heading face supplies the account-hall period signal in short bursts (page titles, panel titles); it never touches body copy, labels, or numbers, so density and scanability are untouched.

### Hierarchy
- **Headline** (IM Fell English, 400, 1.25rem/1.5rem responsive, tight tracking): the page `<h1>` only (e.g. "Alquimia -- Americas"), and the home page's "PlataRank" masthead at 1.875rem/2.25rem.
- **Panel title** (IM Fell English, 400, 1rem): titles of secondary surfaces that aren't the page itself -- the Filtros Sheet's "Filtros y supuestos" -- and the rubro card labels on the home page. Distinct from Headline so a panel never visually competes with the page title.
- **Body** (Geist Sans, 400, 0.875rem): the page subtitle, row detail section prose, error/loading copy, home page description.
- **Tabular** (Geist Mono, ~0.8125rem, `tabular-nums`): every numeric cell -- rank, margin %, volume, quality score, plata/dia, and every derivation-panel figure.
- **Label** (Geist Sans, 400, 0.6875rem/11px, slight tracking): column headers, stat captions, sort-bar caption.

### Named Rules
**The Heading-In-Chrome-Only Rule.** IM Fell English is confined to the page `<h1>`, Sheet/panel titles, and the home page's rubro labels -- never a data-row name, a stat caption, or a numeric value. Anything that is data, not chrome, stays on Geist Sans or Geist Mono.

**The Tabular-Nums Rule.** Any value that is a quantity (silver, percent, count, score) renders in mono with `tabular-nums`; any value that is a label or name renders in the proportional sans. Unchanged from the prior world.

## Layout

Mobile-first, single-column container (`max-w-5xl` for the ranked-list pages, `max-w-3xl` for the home page, centered), padding scaling from dense mobile (`px-3 py-4`) to a slightly looser desktop (`sm:px-6 sm:py-8`). Unchanged from the prior world.

**Sticky header pattern.** The page title block is `sticky top-0 z-20`, bleeds edge-to-edge via negative margin then re-pads, sits on `bg-background/95` with `backdrop-blur`, and now closes with a double ruled line (`border-b-2 border-double`) instead of the old single hairline. The wax-seal mark sits beside the "PlataRank" wordmark inside this header's nav row.

**Multi-surface structure.** All four ranked-list pages (`/alquimia`, `/refinado`, `/cocina`, `/equipo`) share one server component (`recipe-page.tsx`) that owns the sticky header, nav, `RecipeExplorer`/`RecipeTable`, and footer -- unchanged from the prior world, now carrying the ruled-header treatment by construction.

**Row density.** Rows are dense by design: `py-2.5` on mobile collapsing to `py-2` on desktop, virtualized at a 52px row-height estimate. Unchanged from the prior world -- the redesign's explicit constraint was "ornament in the frame, density intact."

**Responsive control fallback.** Sort controls keep two forms: a `hidden sm:flex` inline header row of text+icon sort buttons for desktop, and a `sm:hidden` horizontally-scrollable pill/chip bar for mobile, each row now closed off by the same double ruled divider instead of a plain hairline.

**Ambient texture.** `body` carries a subtle SVG fractal-noise grain (`feTurbulence`, desaturated, 5% opacity, tiled) over the flat umber ground -- the one new ambient/material cue, replacing nothing (the prior world had no body texture).

## Elevation & Depth

Flat. No `box-shadow` in the build. Depth is conveyed through hairline borders (now sepia/bronze-tinted, `oklch(0.8 0.04 65 / 13%)`) and tonal surface steps (ground -> card -> secondary-surface), plus the new grain texture, which reads as material (paper/parchment grain) rather than as elevation. The expandable row detail is distinguished from its parent row only by a translucent card-tint background (`bg-card/50`), not a shadow.

### Named Rules
**The No-Shadow Rule.** Elevation is never simulated with `box-shadow`. Use a border and/or the next tonal surface step instead -- carried forward unchanged; the Filtros `Sheet` and the "ciudad donde craftea" `Select` both still ship with shadcn's default `shadow-md`/`shadow-lg` stripped in favor of a hairline ring/border.

## Shapes

Two radius vocabularies, unchanged in kind though slightly tighter in value: **soft-rectangular** (`rounded-md`, ~6px, down from ~8px after `--radius` moved from 0.625rem to 0.5rem) for containers -- the table wrapper, tier badges, home-page rubro cards -- and **full pill** (`rounded-full`) for anything representing a toggleable/measured state -- sort chips, the quality-score bar track/fill, the scrollbar thumb. Borders are hairline (1px) at ordinary seams; the new **double rule** (2px, `border-double`) marks the chrome dividers named by the Registration-Plate Rule. There is no thick single-stroke or hard-offset shadow treatment anywhere in the build -- the world is candlelit ledger, not neobrutalist.

## Components

### Row + Expandable Detail (signature component)
The core interaction pattern of the whole surface, structurally unchanged from the prior world. Each recipe is a full-width `<button>` row (rank, name + tier/enchant badge, stats, plata/dia) that toggles an inline detail panel on click. A `ChevronDown` icon rotates 180deg to indicate open state. The detail panel exposes the full derivation. Gear rows add a "Por calidad" list; the illiquid-quality price now additionally carries `underline decoration-dashed decoration-muted-foreground underline-offset-4` on top of its existing `opacity-70` treatment -- the Line-Not-Hue Rule below.

### Quality Bar
A thin horizontal bar (`rounded-full` track in muted, filled proportionally to score) paired with the raw numeric score in mono. Shape and mechanism are unchanged from the prior world; only its palette shifted with the rest of the system. The direction contract proposed replacing this with a wax-seal ink-fill gauge -- that did not ship, and this DESIGN.md documents the bar as built.

### Sort Controls
Desktop: inline text+icon buttons in the table header row, active state colored coin-gold. Mobile: a horizontally-scrollable row of full-pill chips, active state gets a coin-gold border/background tint/text. Both rows now sit above a double ruled divider instead of a plain hairline. Unchanged otherwise.

### Ruled Header / Ruled Divider (signature motif)
The double-line rule (`border-b-2 border-double` / `border-t-2 border-double`, sepia hairline color) is the system's one new structural motif, appearing at exactly three places: the sticky page header, the table's sort-bar row (both desktop and mobile forms), and the home page's divider above the rubro grid. It never appears on ordinary row-to-row separators or inside the row-detail panel.

### Wax Seal (signature mark)
A single hand-drawn SVG icon (`WaxSeal`, two concentric circles plus a six-point star cross, one stroke weight, `currentColor`) used as the wordmark mark beside "PlataRank" in every page's nav and as the home page's masthead glyph, always rendered in coin-gold. It is the system's only glyph icon used decoratively rather than functionally (all other icons -- `ChevronDown`, `ArrowUp`/`ArrowDown`/`ArrowUpDown`, `SlidersHorizontal` -- are Lucide functional-UI icons, unchanged from the prior world).

### Badges
Stock shadcn `Badge`, used narrowly: `secondary` variant for the tier/enchant tag, `outline` variant for "datos insuficientes". Unchanged from the prior world.

### Buttons
Only two button treatments appear in the build: the plain-bordered retry/Filtros button (`rounded-md border border-border`, `hover:bg-accent`, no accent color) and the row/chip buttons described above. Unchanged from the prior world -- there is still no filled primary-coin-gold button anywhere.

## Do's and Don'ts

### Do:
- **Do** reserve coin-gold for the plata/dia figure, active sort/filter state, and the wax-seal mark only.
- **Do** confine IM Fell English to the page `<h1>`, Sheet/panel titles, and rubro card labels -- never a data value or row name.
- **Do** render every quantity in Geist Mono with `tabular-nums`; every name/label in Geist Sans.
- **Do** use a double ruled line (`border-double border-b-2`/`border-t-2`) for structural, once-per-surface chrome dividers (sticky header, sort-bar, home rubro divider); keep ordinary row separators as plain 1px hairlines.
- **Do** mark stale/illiquid values with both reduced opacity and a dashed underline (the Line-Not-Hue Rule), so state survives grayscale.
- **Do** keep new ranked-list surfaces on the row + expandable-detail pattern with density and the Quality Bar's existing bar/track shape untouched.

### Don't:
- **Don't** introduce a light theme variant; dark-only is a confirmed product decision (`<html class="dark">` is hardcoded).
- **Don't** add blackletter, gilt/illuminated-manuscript ornament, or additional glyph icons beyond the single wax-seal mark -- the direction contract explicitly refused a fantasy-game skin.
- **Don't** add box-shadows or hard-offset shadows for elevation or "medieval" flavor; step to the next tonal surface or a hairline/double-rule border instead.
- **Don't** spread coin-gold onto buttons, nav text, or non-ranking UI beyond the wax-seal mark.
- **Don't** let chrome ornament (heading face, double rules) migrate into data rows; row density and the row's internal typography stay exactly as before.
- **Don't** treat the quality gauge as a wax-seal ink-fill device; the build kept the plain bar/track shape -- style any future quality-signal change as a palette change, not a shape invention.
</content>
