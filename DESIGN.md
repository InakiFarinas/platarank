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
  crest: "oklch(0.36 0.13 25)"
  forest: "oklch(0.4 0.06 155)"
typography:
  display:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0em"
    textTransform: "uppercase"
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
  button-primary:
    backgroundColor: "{colors.coin-gold}"
    textColor: "{colors.coin-gold-foreground}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "color-mix(in oklch, {colors.coin-gold} 10%, transparent)"
    textColor: "{colors.coin-gold}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
---

# Design System: PlataRank

## Overview

**Creative North Star: "The Guild Ledger"**

PlataRank stayed a single-purpose Operate surface -- dark, dense, read one-handed next to the game -- but its chrome was rebuilt as a merchant guild's account-hall noticeboard rather than a trading-floor ticker. The ground shifted from a cool near-black neutral (hue 285) to a warm, candlelit umber (hue ~55-75, OKLCH), and the sticky header, sort-bar dividers, and the home page's rubro divider all now carry a double ruled line (`border-double border-b-2` / `border-t-2`) standing in for a ledger's ruled hairline. IM Fell English, a legible period print face, now carries the page `<h1>` and panel titles (the Filtros Sheet's "Filtros y supuestos", the rubro card labels); Geist Sans keeps every body/label role and Geist Mono keeps every numeric value untouched -- a deliberate legibility call, not an oversight. A single hand-drawn wax-seal SVG mark (`WaxSeal`, one stroke weight, no fill gradients) sits beside the "PlataRank" wordmark in the nav and as the home page's masthead.

The world stops at the frame. The direction contract's thesis -- "ornament lives in chrome only, data rows stay exactly as dense/unadorned as before" -- holds in the build: the row list, its virtualization, the expandable derivation panel, badges, selects, and sheets are byte-identical in structure to the prior world, restyled only through the same CSS custom properties. The one structural change inside a data row is additive, not decorative: illiquid quality-breakdown prices now carry `underline decoration-dashed decoration-muted-foreground underline-offset-4` alongside their existing reduced opacity, so stale/illiquid state reads even in grayscale or under color-blindness, not only through alpha.

Note on the data-quality score's history, since it changed direction twice: the original direction contract proposed rendering it as "a wax-seal ink-fill gauge, not a bar," which the first finish review declined in favor of keeping the plain `QualityBadge` bar. A later mobile-first pass then shipped the wax-seal gauge anyway, scoped to the mobile Contract Card only, on an explicit user request overriding that earlier restraint call. The user then asked to remove the data-quality score entirely -- both the desktop bar and the mobile seal are gone, along with the row-detail's "Score de calidad" line and the formula that computed it (`computeQualityScore`). The signals it used to summarize (city coverage, data age, discarded outliers) are still visible individually in the derivation panel; they are no longer synthesized into one 0-100 number anywhere in the UI.

**2026-09 update -- "Guild Ceremony" chrome pass.** The home page (`/es`) was rebuilt as the ceremonial front door to the guild ledger: a Cinzel display face (bold, uppercase, tracked) now carries its hero `<h1>`/`<h2>`s alongside new shield-shaped icon badges (`ShieldBadge`), a dashed `rule-fleur` section divider, and two homepage-only accent tokens (`crest`, a deep burgundy, and `forest`, a muted green) that do not appear on the four ranked-list pages. That same Cinzel display face was then carried into the shared `RecipeHeader` (`recipe-header.tsx`) so every page's `<h1>` and the "PlataRank" wordmark speak with one voice; the rubro nav tabs moved from a bordered box to an underline (`border-b-2`) to match the home page's own nav pattern, and the header/footer wax-seal frame became circular (matching the home page) instead of the old `rounded-md` square. This is a deliberate widening, not scope creep: the ranked-list pages' **data rows, sort controls, filters, and Sheets are untouched** -- only the page-level chrome (title, nav, wordmark, footer) picked up the new voice. `crest`/`forest` and `ShieldBadge` stay home-page-only for now; nothing below assumes they've spread further.

**2026-09 update -- shared shell, calculator, and the trust pass.** One `SiteHeader` (`site-header.tsx`) now serves the home page, the ranked-list pages, the calculator, sessions, and the legal pages: logo, an 8-item nav (Inicio, Alquimia, Refinado, Cocina, Equipo, Monturas, Calculadora, Sesiones), and the Discord login. The "ciudad donde craftea" control left the header and became the first card of the Filtros panel (and its own panel in the calculator), so the header stays about navigation. The calculator (`/es/calculadora`) grew three tabs -- Calculadora, Planificaciones, Transporte -- built from the same `Panel`/`Segmented`/`Field` primitives (`calculator/ui.tsx`), and money-colored actions got two shared classes (`CTA_PRIMARY`, `CTA_SECONDARY` in `src/lib/cta.ts`) instead of per-page copies. Trust rules from PRODUCT.md reached the UI: every material shows the cheapest city to buy in, a price that is far from its own 30-day average is discarded and named as such, and empty data reads "datos insuficientes" rather than a number.

**Key Characteristics:**
- Dark-only "guild ground" -- warm oak/umber (hue ~55-75), replacing the old cool-zinc neutral; no light theme exists or is planned.
- One accent color, unchanged in value, doing double duty as coin-gold and wax-seal ink: reserved for the plata/dia figure, active/selected state (sort, filter chips, tabs, toggles), the money-colored CTAs and inline links, and the wax-seal mark. It never marks decoration or section headings.
- Cinzel (display, bold uppercase) now carries every page's `<h1>` and the "PlataRank" wordmark; IM Fell English still carries secondary panel titles (the Filtros Sheet's "Filtros y supuestos"); Geist Sans stays on body/labels; Geist Mono stays untouched on every number.
- Double ruled hairlines (`border-double border-b-2`) mark every major chrome divider -- header, sort-bar, home-page section dividers; a dashed `rule-fleur` divider marks the home page's footer and feature sections specifically.
- Stale/illiquid data is now marked by line form (dashed underline) in addition to color/alpha, not by color alone.
- Data-row density and the row+expandable-detail interaction are unchanged from the prior world.

## Colors

A warm, low-to-mid-chroma umber/parchment scale (OKLCH, hue ~55-75, candlelit rather than screen-lit) with the same single coin-gold accent carried forward unchanged in value from the prior world.

### Primary
- **Coin Gold** (`oklch(0.78 0.16 68)`): the plata/dia figure (the row's largest, boldest number), every active/selected state (desktop `SortHeader`, mobile `MobileSortChip`, the calculator's tabs and segmented controls, selected city-buy/sell toggles), the two CTA looks (`CTA_PRIMARY` filled, `CTA_SECONDARY` outline-tint), inline links to Discord and Ko-fi, and the wax-seal mark. Also drives `:focus-visible` outlines and the text-selection tint. It is not used for section titles, filter chips that merely restate a filter, or loading decoration.

### Neutral
- **Guild Ground** (`oklch(0.16 0.017 55)`): page background -- warm near-black umber, replacing the old cool-zinc `oklch(0.14 0.003 285)`.
- **Ledger Card** (`oklch(0.21 0.02 55)`): row-detail panel background (used at 50% opacity), popover/card surfaces.
- **Secondary Surface** (`oklch(0.27 0.022 55)`): tier badges, row hover state, sort-chip inactive backgrounds.
- **Parchment Ink** (`oklch(0.92 0.018 75)`): primary text -- warmer and slightly higher-chroma than the old cool-white foreground.
- **Muted Foreground** (`oklch(0.67 0.03 65)`): secondary stats, labels, timestamps, inactive sort icons.
- **Hairline Border** (`oklch(0.8 0.04 65 / 13%)`): sepia/bronze-tinted, the base separator device -- carried at 1px on ordinary row borders and doubled (`border-double border-b-2`) at the chrome dividers named by the Registration-Plate Rule below.

### Named Rules
**The One Coin Rule.** Coin-gold means "money, or the thing you have chosen": the plata/dia figure, active/selected state, the money CTAs, and the wax-seal mark. Filter section titles and the chips that restate an active filter stay neutral (`text-foreground`, `bg-secondary/40`), so gold keeps one meaning. The city selector's faction colors (see the Faction Banner Rule) are the one other deliberate exception, scoped to exactly that control. `crest` and `forest` (home-page-only accents) are outside this rule entirely -- they exist to give the home page a second and third hue, not to widen coin-gold's own reach.

**The Faction Banner Rule.** The "ciudad donde craftea" selector -- the first card of the Filtros panel on the ranked-list pages and the "Ciudad de crafteo" panel in the calculator -- carries a saturated per-city color (Bridgewatch amber, Fort Sterling cyan, Lymhurst emerald, Martlock blue, Thetford purple, Caerleon red, Brecilien fuchsia, Black Market yellow-on-stone) plus the city's banner emblem (`CityGlyph`), an explicit user request overriding the One Coin Rule for identity purposes. It never touches any other control: the buy/sell city toggles right below it in Filtros use the neutral selected state (`border-money bg-money/10`), because twelve saturated buttons would dilute the one control that is allowed a palette.

**The Registration-Plate Rule.** Every major chrome divider is a deliberate ruled hairline, not a plain 1px rule: the sticky page header (`border-b-2 border-double`), the desktop and mobile sort-bar dividers in the table (`border-b-2 border-double`), and the home page's divider above the rubro grid (`border-t-2 border-double`). Ordinary row-to-row separators inside the table stay plain 1px hairlines -- the double rule is reserved for structural, once-per-surface dividers, not every seam.

## Typography

**Display Font:** Cinzel (Georgia, serif fallback), bold, uppercase, tight tracking -- carries every page's `<h1>` and the "PlataRank" wordmark since the Guild Ceremony pass. A ceremonial Roman-capitals face, not a blackletter or fantasy-display face.
**Secondary Heading Font:** IM Fell English (Georgia, serif fallback) -- a legible period print face, now confined to secondary panel titles (the Filtros Sheet's "Filtros y supuestos").
**Body/Label Font:** Geist Sans (system-ui, sans-serif fallback) -- unchanged from the prior world.
**Tabular/Mono Font:** Geist Mono (ui-monospace fallback), applied with `tabular-nums` to every numeric value -- unchanged from the prior world.

**Character:** A ceremonial display face for the one `<h1>` per page and the wordmark, a quieter print face for secondary panel titles, and the same utilitarian sans-and-mono body pairing as before. Neither heading face touches body copy, labels, or numbers, so density and scanability are untouched.

### Hierarchy
- **Display** (Cinzel, 700, uppercase, 1.25rem/1.5rem responsive, tight tracking): the page `<h1>` only (e.g. "ALQUIMIA -- AMERICAS"), the "PlataRank" wordmark in every header/footer, and the home page's hero/section `<h1>`/`<h2>`s at up to 3.75rem.
- **Panel title** (IM Fell English, 400, 1rem): titles of secondary surfaces that aren't the page itself -- the Filtros Sheet's "Filtros y supuestos". Distinct from Display so a panel never visually competes with the page title.
- **Body** (Geist Sans, 400, 0.875rem): the page subtitle, row detail section prose, error/loading copy, home page description.
- **Tabular** (Geist Mono, ~0.8125rem, `tabular-nums`): every numeric cell -- rank, margin %, volume, plata/dia, and every derivation-panel figure.
- **Label** (Geist Sans, 400, 0.6875rem/11px, slight tracking): column headers, stat captions, sort-bar caption.

### Named Rules
**The Heading-In-Chrome-Only Rule.** Cinzel is confined to the page `<h1>` and the wordmark; IM Fell English is confined to secondary Sheet/panel titles -- neither ever touches a data-row name, a stat caption, or a numeric value. Anything that is data, not chrome, stays on Geist Sans or Geist Mono.

**The Tabular-Nums Rule.** Any value that is a quantity (silver, percent, count, score) renders in mono with `tabular-nums`; any value that is a label or name renders in the proportional sans. Unchanged from the prior world.

## Layout

Mobile-first single-column container for the home page (`max-w-3xl`, centered); the four ranked-list pages widened to `max-w-[1600px]` (from `max-w-5xl`) specifically to earn a real desktop payoff -- the extra width exists to show the `xl:`-only Costo/Precio venta/Ciudad bono columns (see Rubro Tabs/City Selector below and the Row + Expandable Detail component), not just to stretch the same content thinner. Padding scales from dense mobile (`px-3 py-4`) to `sm:px-6 sm:py-8 lg:px-8` at the widened container's largest step.

**Sticky header pattern.** `SiteHeader`'s nav strip is `sticky top-0 z-20` on `bg-background/90` with `backdrop-blur-md`, closed by the double ruled line tinted toward coin-gold (`border-b-2 border-double border-money/30`). On the ranked-list pages the header renders inside `<main>`'s `max-w-[1600px]`, so the bar breaks out to the full viewport (`ml-[calc(50%-50vw)] mr-[calc(50%-50vw)] w-screen`) and its content re-centers to the same 1600px, keeping the bar edge to edge like on the calculator page while the nav still lines up with the table. Only the strip is sticky; the title block scrolls away.

**Multi-surface structure.** The ranked-list pages (`/alquimia`, `/refinado`, `/cocina`, `/equipo`, `/monturas`) share one server component (`recipe-page.tsx`) that renders `RecipeExplorer` and the footer; `RecipeExplorer` (client) renders `SiteHeader`, the search, the Filtros panel and the table, and owns the sort state so a large station (gear) can be re-ranked by the server for the chosen column instead of re-sorting a truncated top 300. Gear's default view comes from a snapshot precomputed by the ingester. The table paginates at 25 rows.

**Calculator layout.** `/es/calculadora` is a `max-w-5xl` column: item card, then "Ciudad de crafteo" and "Condiciones" panels on the left, the balance panel (sticky, capped to the viewport) on the right from `lg:`, a fixed "Ver balance" bar below it. The tab strip switches between the calculator, saved plans, and the Transporte tool without leaving the page.

**Row density.** Rows are dense by design: `py-2.5` on mobile collapsing to `py-2` on desktop, virtualized at a 52px row-height estimate. Unchanged from the prior world -- the redesign's explicit constraint was "ornament in the frame, density intact."

**Responsive control fallback.** Sort controls keep two forms: a `hidden sm:flex` inline header row of text+icon sort buttons for desktop, and a `sm:hidden` horizontally-scrollable pill/chip bar for mobile, each row now closed off by the same double ruled divider instead of a plain hairline.

**Ambient texture.** `body` carries a subtle SVG fractal-noise grain (`feTurbulence`, desaturated, 5% opacity, tiled) over the flat umber ground -- the one new ambient/material cue, replacing nothing (the prior world had no body texture).

## Elevation & Depth

Flat. No `box-shadow` in the build. Depth is conveyed through hairline borders (now sepia/bronze-tinted, `oklch(0.8 0.04 65 / 13%)`) and tonal surface steps (ground -> card -> secondary-surface), plus the new grain texture, which reads as material (paper/parchment grain) rather than as elevation. The expandable row detail is distinguished from its parent row only by a translucent card-tint background (`bg-card/50`), not a shadow.

### Named Rules
**The No-Shadow Rule.** Elevation is never simulated with `box-shadow`. Use a border and/or the next tonal surface step instead; the Filtros `Sheet` and the `Select` popups ship with shadcn's default `shadow-md`/`shadow-lg` stripped. The hero's primary CTA gets its offset ring from `outline` (`outline-1 outline-offset-[3px] outline-money/40`), not a shadow.

## Shapes

Two radius vocabularies, unchanged in kind though slightly tighter in value: **soft-rectangular** (`rounded-md`, ~6px, down from ~8px after `--radius` moved from 0.625rem to 0.5rem) for containers -- the table wrapper, tier badges, home-page rubro cards -- and **full pill** (`rounded-full`) for anything representing a toggleable/measured state -- sort chips, the scrollbar thumb. Borders are hairline (1px) at ordinary seams; the new **double rule** (2px, `border-double`) marks the chrome dividers named by the Registration-Plate Rule. There is no thick single-stroke or hard-offset shadow treatment anywhere in the build -- the world is candlelit ledger, not neobrutalist.

## Components

### Row + Expandable Detail (signature component)
The core interaction pattern of the whole surface, structurally unchanged from the prior world. Each recipe is a full-width `<button>` row (rank, name + tier/enchant badge, stats, plata/dia) that toggles an inline detail panel on click. A `ChevronDown` icon rotates 180deg to indicate open state. The detail panel exposes the full derivation. Gear rows add a "Por calidad" list; the illiquid-quality price now additionally carries `underline decoration-dashed decoration-muted-foreground underline-offset-4` on top of its existing `opacity-70` treatment -- the Line-Not-Hue Rule below.

**Wide-desktop columns (`xl:` and up only).** Once the container widened to `max-w-[1600px]`, three more stats earned real screen space without crowding the row at any narrower width: Costo (cost per unit), Precio venta (sell reference price), and Ciudad bono (the recipe category's specialty city, or `--` when none). All three reuse fields `computeRecipeRow` already produced for the derivation panel -- nothing new was computed to fill the wider table, keeping every number traceable to the same source it always had. Costo and Precio venta are sortable through the same `SortKey`/`SORT_ACCESSORS` mechanism as the existing columns; Ciudad bono is a label only, not sortable (it's not a meaningful ranking axis on its own).

### Rubro Tabs (header nav)
The rubro nav links (Alquimia 174, Refinado 115, Cocina 183, Equipo 5.7k, Monturas 29) each carry a recipe-count pill (hardcoded in `NAV_ITEMS` the same way the home page's station cards hardcode their counts), beside Inicio, Calculadora and Sesiones. Since the Guild Ceremony pass, the active/inactive distinction is an underline, matching the home page's own nav: active gets `border-b-2 border-money text-money` with a `bg-money/20` count pill; inactive gets `border-b-2 border-transparent text-muted-foreground` (hover tints the border `border-money/30`) with a `bg-background/60` count pill. No background fill on either state. Below `lg:` the tabs collapse into a left Sheet menu.

### City Selector (Filtros panel and calculator, faction-themed)
A grid of city buttons, one per real city, in the first Filtros card (two columns, three from `@sm`) and in the calculator's "Ciudad de crafteo" panel (taller `h-14` tiles, collapsed to the selected and bonus city with an "Otras ciudades (N)" disclosure). The selected city is colored per the Faction Banner Rule (`border`/`bg`/`text` from `CITY_THEMES`, `src/lib/city-theme.ts`) with its emblem (`CityGlyph`); every city that has a specialty for the current rubro shows a coin-gold bonus label ("+15% crafteo" / "+40% refinado"), computed from that rubro's actual recipe categories against `city-specialties.json` (`RecipeExplorer`'s `cityBonuses` map). A city with no specialty gets no label, not a "sin bono" placeholder. It moved out of the header so the nav strip carries only navigation.

### Server Badge (header control, desktop only, ranked-list pages)
A neutral (non-faction-colored) `Select` in the header beside the login button (shown only when the page passes `showServerBadge`) showing "Americas", the only AODP region this app has ever ingested data for. It stays genuinely interactive (`onValueChange` is a no-op, not `disabled` on the whole trigger) so a player can open it and see Europe/Asia listed as individually `disabled` items labeled "sin datos todavía" -- the control is honest about what's real without either faking a working multi-region switch or hiding the fact that other regions exist. Hidden below `sm:` -- on a 375px phone this control plus the login button plus the nav tabs cannot all fit without pushing tabs off-screen, and per the Working Memory Rule and this app's own mobile-first principle, the nav's job (confirming where you are) wins that space fight over a control whose value never changes.

### Contract Card (mobile row, "Registro de Contratos")
Mobile's replacement for the dense ledger row, following the same `sm:hidden` / `hidden sm:block` split the table's sort controls already used. Layout: a 40px item-render icon (from `render.albiononline.com`, the standard unauthenticated Albion item-icon CDN already used by the wider AODP tool ecosystem) in a bordered `secondary`-tinted frame + name + tier badge, plata/dia as the top-right hero figure in coin-gold with a soft coin-gold text-shadow (a candlelit glow, not a drop-shadow-as-elevation -- the No-Shadow Rule governs surface elevation, not emphasis on the one hero number), a liquidity line (`Droplet` icon + daily volume), and Quality Gems (below) for gear rows. Ends in a dashed-rule "Ver detalle" row with a chevron -- the visible affordance that the whole card opens the derivation in a Sheet instead of expanding inline (see Pergamino Sheet); the earlier 14px muted scroll icon was too weak a cue on the primary reading context. Originally launched with a top-left wax-seal data-quality score; that score was removed project-wide on a later explicit user request, so the card no longer carries one.

### Quality Gems (mobile, gear rows only)
Five small rotated squares (diamonds), one per quality tier, filled coin-gold when that quality is liquid and priced, dimmed muted otherwise. A compact visual echo of the row-detail's textual "Por calidad" list, sized for a glance rather than a read.

### Pergamino Sheet (mobile derivation)
The mobile Contract Card's derivation opens in its own bottom `Sheet` (title = recipe name, `border-t-2 border-double` top edge) instead of expanding inline like the desktop row -- reuses the exact same `RowDetail` content/markup as desktop, just relocated into a sheet so it doesn't have to compete for space in a narrow card. The Filtros trigger moved to match: a fixed circular button (bottom-right, `border-double`) instead of an inline header button, so it stays reachable one-handed while scrolling a long list.

### Sort Controls
Desktop: inline text+icon buttons in the table header row, active state colored coin-gold. Mobile: a horizontally-scrollable row of full-pill chips, active state gets a coin-gold border/background tint/text. Both rows now sit above a double ruled divider instead of a plain hairline. Unchanged otherwise.

### Ruled Header / Ruled Divider (signature motif)
The double-line rule (`border-b-2 border-double` / `border-t-2 border-double`, sepia hairline color) is the system's one new structural motif, appearing at exactly three places: the sticky page header, the table's sort-bar row (both desktop and mobile forms), and the home page's divider above the rubro grid. It never appears on ordinary row-to-row separators or inside the row-detail panel.

### Wax Seal (signature mark)
A single hand-drawn SVG icon (`WaxSeal`, two concentric circles plus a six-point star cross, one stroke weight, `currentColor`) used as the wordmark mark beside "PlataRank" in every page's nav and footer, and as the home page's masthead/CTA glyph, always rendered in coin-gold. Since the Guild Ceremony pass its frame is a circular badge (`rounded-full border-money/50 bg-money/10` with a layered ring `box-shadow` echoing a pressed wax seal) everywhere it appears, replacing the earlier `rounded-md` square frame -- one consistent asset/frame across home page, `RecipeHeader`, and `recipe-page.tsx`'s footer. It is the system's only glyph icon used decoratively rather than functionally (all other icons -- `ChevronDown`, `ArrowUp`/`ArrowDown`/`ArrowUpDown`, `SlidersHorizontal` -- are Lucide functional-UI icons, unchanged from the prior world).

### Footer (page-level chrome)
Every page closes with a dashed `rule-fleur` divider above a footer row: the wax-seal + Cinzel "PlataRank" wordmark on one side, attribution/disclaimer copy on the other, then a "Legal" nav (Metodologia, Privacidad, Terminos, plus the Discord and Ko-fi links in coin-gold). One shared component, `SiteFooter`, owns it; each page passes its own copy as children. The legal links keep a 24px tall hit area (`min-h-6`) around 12px text, the WCAG 2.2 target-size minimum, without changing how the row reads.

### Calculator Panels, Tabs and the Transporte tool
The calculator's building blocks are `Panel` (IM Fell title over a hairline, `rounded-md border bg-card/40`), `Segmented` (joined radio group, 44px touch height on mobile), `Field` (label + input) and `InfoTip` (a tap/click/Enter tooltip, never a `title` attribute). The three tabs (Calculadora, Planificaciones, Transporte) are a `role=tablist` with arrow-key/Home/End navigation. Transporte (`src/components/transport/transport-tool.tsx`) stacks a "Capacidad de carga" panel (bag, mount, gathering cape, food and Courier-shoes toggles), a "Que vas a transportar" panel (search plus quantity rows), and a sticky result panel with weight, capacity, load percentage in coin-gold (destructive red past 100%) and the resulting movement speed. Figures that are estimates (the Courier-shoes bonus) say so in their own label.

### Badges
Stock shadcn `Badge`, used narrowly: `secondary` variant for the tier/enchant tag, `outline` variant for "datos insuficientes". Unchanged from the prior world.

### Buttons
Three treatments. **Primary CTA** (`CTA_PRIMARY`): filled coin-gold, `text-money-foreground`, `rounded-sm`, hover to 90% opacity -- the one action of a section ("Ver recetas rentables", "Unirme al Discord", the calculator's "Ver balance"). **Secondary CTA** (`CTA_SECONDARY`): `border-money/50 bg-money/10 text-money` -- the login button, "Abrir calculadora", "Abrir en la calculadora". Size (height, padding, text) stays per call site; the two constants in `src/lib/cta.ts` own color, weight and interaction, so a palette change is one edit. **Neutral button**: the plain-bordered retry/Filtros button (`rounded-md border border-border`, `hover:bg-accent`, no accent color). Primary CTAs are rationed to one per section.

## Do's and Don'ts

### Do:
- **Do** reserve coin-gold for the plata/dia figure, active/selected state, the money CTAs and links, and the wax-seal mark; keep section titles and restating chips neutral.
- **Do** confine Cinzel to the page `<h1>` and the "PlataRank" wordmark, and IM Fell English to secondary Sheet/panel titles -- never a data value or row name.
- **Do** render every quantity in Geist Mono with `tabular-nums`; every name/label in Geist Sans.
- **Do** use a double ruled line (`border-double border-b-2`/`border-t-2`) for structural, once-per-surface chrome dividers (sticky header, sort-bar, home rubro divider); keep ordinary row separators as plain 1px hairlines.
- **Do** mark stale/illiquid values with both reduced opacity and a dashed underline (the Line-Not-Hue Rule), so state survives grayscale.
- **Do** keep the desktop row + expandable-detail pattern's density untouched; mobile's Contract Card is its own composition, not a squeezed copy of the desktop row.
- **Do** keep the Faction Banner Rule's saturated per-city colors and emblem glyphs confined to the city selector -- it is the one control allowed a full palette, not a precedent for adding color elsewhere.
- **Do** build any money-colored button from `CTA_PRIMARY` or `CTA_SECONDARY` (`src/lib/cta.ts`) and add only size and layout classes.
- **Do** give any small text link a 24px-tall hit area (`min-h-6` or an `after:-inset-*` pad), and keep touch targets on the mobile-first surfaces at 44px.
- **Do** keep color feedback under `prefers-reduced-motion`; remove movement (transforms, spinners), not the hover change itself.

### Don't:
- **Don't** introduce a light theme variant; dark-only is a confirmed product decision (`<html class="dark">` is hardcoded).
- **Don't** treat "no gilt ornament" as absolute -- it was tried once (a small gold corner flourish on the header, referencing an ornate laurel-and-gem border image) and the user removed it again shortly after; a later explicit request then asked for a full ceremonial pass on the home page plus the shared chrome (see the Guild Ceremony update above), so the constraint is scoped to unrequested/unscoped ornament, not ornament as such. Judge a future ornament request on its own merits.
- **Don't** add box-shadows or hard-offset shadows for elevation; step to the next tonal surface or a hairline/double-rule border instead, and use `outline` for an offset ring. The wax-seal's own ring `box-shadow` is a named exception (emphasis on one small decorative mark, not surface elevation) -- don't generalize it into an elevation device elsewhere.
- **Don't** spread coin-gold onto decoration: section titles, chips that only restate a filter, loading text, or a second primary CTA competing in the same section.
- **Don't** let `crest`/`forest` or `ShieldBadge` migrate from the home page into the ranked-list pages without an explicit request -- they are a deliberately home-page-only accent, not the next step in this widening.
- **Don't** let chrome ornament (heading face, double rules) migrate into data rows; row density and the row's internal typography stay exactly as before.
- **Don't** show a number the data can't support: a price far from its own 30-day average is discarded and named (`outlier_self`), and a recipe with no trustworthy price reads "datos insuficientes", never a large figure.
- **Don't** reintroduce a synthesized 0-100 data-quality score (bar, seal, or otherwise) -- it was tried in two different shapes and removed both times at explicit user request. The derivation panel's individual signals (city count, data age, discarded outliers) are the source of truth for data trust now.
</content>
