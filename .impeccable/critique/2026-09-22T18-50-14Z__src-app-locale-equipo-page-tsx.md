---
target: pagina de ranking (/es/equipo)
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\equipo\\page.tsx"
target_fingerprint: "sha256:1affc346918e86cfd86d74a50012533d9239c82bcddc9b57a9652669329cde3c"
target_path: "D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\equipo\\page.tsx"
timestamp: 2026-09-22T18-50-14Z
slug: src-app-locale-equipo-page-tsx
---
Method: dual-agent (A: a9665af855ad86388 · B: a13adf6169db4177b)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Recalculation states are clear, but sorting by anything other than plata/día gives no signal it's re-sorting an already-truncated top-300 slice. |
| 2 | Match System / Real World | 4 | Spanish domain copy, real city names/specialties map cleanly to player mental model. |
| 3 | User Control and Freedom | 3 | Good undo paths (chips, "Restaurar valores por defecto", "Reintentar"); no page-size control. |
| 4 | Consistency and Standards | 3 | Registration-Plate rule applied consistently; One Coin Rule not — gold leaks onto filter section titles and chips. |
| 5 | Error Prevention | 3 | `NumberField` clamps with explicit "Ajustado a X" messaging before commit. |
| 6 | Recognition Rather Than Recall | 3 | Active filter chips + sort direction icons externalize state well. |
| 7 | Flexibility and Efficiency | 2 | 10 rows/page over a pre-ranked pool of up to 300, no page-size control, on a page whose own principle is density. |
| 8 | Aesthetic and Minimalist Design | 3 | Dense but not cluttered; progressive column hiding at `xl:`/`lg:` keeps narrower widths clean. |
| 9 | Error Recovery | 3 | `remoteError` + "Reintentar" banner is explicit and on-brand with "never smooth over stale data." |
| 10 | Help and Documentation | 3 | "¿Qué hace el bono de ciudad?" disclosure explains a real game mechanic in context; no equivalent for "Cuota de mercado." |
| **Total** | | **30/40** | **Good** |

## Design Specificity Verdict

**LLM assessment:** Not a reskinned generic price-comparison table. The Faction Banner city glyphs (cropped from tall wooden standard art with precise background-position math), the "Registro de Contratos" mobile card framing, the wax-parchment noise texture, the double-ruled structural dividers, and the derivation-first row detail ("Descartado: precio anormalmente bajo") all read as authored for this specific Albion Online crafting-economy problem by someone who understands the domain. The one place genericism is creeping back in is exactly where the system's own named rules are being ignored: the coin-gold accent has spread well past its documented four uses, which is the generic-dashboard reflex ("gold = anything currently active") re-entering a system that deliberately rationed it.

**Deterministic scan:** `impeccable detect --json` against `src/components/recipes`, `src/components/site-header.tsx`, and `src/app/[locale]/equipo/page.tsx` returned exit code 0 — **zero findings**. The detector catches structural/mechanical anti-patterns; it does not catch a documented design-system rule (One Coin Rule, Faction Banner Rule) being violated by otherwise well-formed, consistent code, which is exactly what Assessment A found by reading the actual rule set. No false positives to adjudicate since there were no findings.

**Visual overlays:** No browser-injected overlay was run this pass (script-injection detector flow was not exercised); Assessment B instead captured direct screenshots. Desktop (~800px) rendered cleanly on first load: header, "ARMAS Y ARMADURAS — AMERICAS" title, search box, Filtros sidebar, and the ranked table with Costo/Precio venta/Ciudad bono/Margen/Vol día/Plata día columns all present with no clipping. A later resize to 1400×900 triggered a stale-Turbopack-cache 500 (`ENOENT ... app-build-manifest.json`) that persisted for the rest of that assessment's session — confirmed as a dev-cache artifact, not a source defect, since `/es` kept compiling and serving normally throughout, and a fresh navigation after restarting the dev server loaded `/es/equipo` correctly again.

## Overall Impression

The page is well above the "generic ranking table" bar it could have settled for, and the derivation panel is the real proof: it's the one place the product's central promise ("trust the number") gets fully delivered in the UI. The single biggest opportunity is trust-integrity, not decoration — the sort control silently operates on a pre-truncated 300-row slice instead of the full catalog, which is a small mechanical gap sitting directly behind the app's biggest credibility claim. The second-biggest opportunity is discipline: the One Coin Rule and Faction Banner Rule, both already written down and both already correctly followed in the row/derivation/header components, have quietly loosened in the newer Filtros/chips surface.

## What's Working

1. **`RowDetail` (recipe-row.tsx)** — the derivation panel (venta breakdown, per-quality liquidity dots with `title`/`aria-label`, humanized `Descartado` reasons) is a genuinely well-executed implementation of "never show a number without showing where it came from."
2. **`CityGlyph` (site-header.tsx)** — cropping a full banner illustration into a tiny badge via precise background-position math is a level of craft a generic tool wouldn't bother with, and it stays correctly scoped to the city selector only.
3. **Touch-target discipline** — the recurring `after:absolute after:-inset-y-*` pattern (nav tabs, filter chips, city toggles, pagination) consistently pads hit areas without inflating the dense visual layout — the right trade-off for a density-first Operate surface.

## Priority Issues

**[P0] Sorting silently operates on a pre-truncated, differently-ranked slice**
- **What**: `rankStation` (station-data.ts) always ranks and truncates to the top 300 by `platinumPerDay` before any player-chosen sort runs; the table's `sortKey`/`SORT_ACCESSORS` only re-sort that already-truncated 300, never the full ~5,711-recipe catalog.
- **Why it matters**: sorting by "Margen" or "Vol/día" looks like a real re-rank but is actually a re-sort of a subset selected by a different metric. A recipe with the best margin in the whole catalog is invisible if it didn't also make the plata/día top 300 — and nothing in the UI says so. For a tool whose entire pitch is "trust the derivation," this is the largest gap between what a control promises and what it delivers, and it fails silently.
- **Fix**: either rank server-side by the active `sortKey` (pass sort into `/api/rank`), or make the scoping explicit in the UI, e.g. "300 mejores por plata/día — el orden por margen se aplica dentro de este subconjunto."
- **Suggested command**: `/impeccable harden`

**[P1] One Coin Rule is diluted on the Filtros/chips surface**
- **What**: `FilterCard` colors every section heading gold (`text-money` on "Ciudades", "Supuestos de cálculo", "Filtros de listado"); `ActiveFilterChips` renders every active filter as a full `border-money/50 bg-money/10 text-money` pill; the recalculating pill/loader text also uses `text-money`.
- **Why it matters**: DESIGN.md reserves coin-gold for four specific marks (plata/día, active sort, wax-seal, active tab underline) precisely so gold keeps one meaning. Spreading it across section headings and every filter chip breaks that grammar for exactly the users (per Assessment A, notably anyone relying on color semantics) who benefit most from a color meaning one thing consistently.
- **Fix**: move `FilterCard` titles and filter chips to neutral `text-foreground`/`border-border`; keep gold reserved for plata/día and active-sort state.
- **Suggested command**: `/impeccable quieter`

**[P1] Faction Banner Rule's saturated city colors leak into the Filtros city toggles**
- **What**: `CitySection` (controls.tsx) applies full per-city saturated `theme.border/bg/text` to the buy/sell city toggle buttons inside the Filtros panel — up to 12 simultaneously-saturated buttons — not just the header's single city selector the rule is scoped to.
- **Why it matters**: the rule exists as a deliberate, narrow exception ("it never touches any other control") precisely so the header selector keeps its identity-marking specialness. Reusing the same full palette on a multi-select filter list both dilutes that specialness and adds real visual noise to a panel meant to stay comparatively neutral.
- **Fix**: give buy/sell city toggles one neutral "active" treatment (e.g. `border-money bg-money/10`) and drop the per-city palette from `CitySection`.
- **Suggested command**: `/impeccable harden`

**[P2] 10-row pagination undercuts the page's own density principle**
- **What**: `PAGE_SIZE = 10` in `recipe-table.tsx`, even at desktop widths, over a pre-ranked pool of up to 300 rows.
- **Why it matters**: scanning the full pre-fetched ranking — the thing a power user actually wants — takes up to 30 page-clicks, which contradicts the "dense Operate surface" principle the row design itself otherwise honors.
- **Fix**: raise the desktop page size (25–50) or move to virtualized/infinite scroll for the ranked list; keep a smaller page size on the mobile card view if needed.
- **Suggested command**: `/impeccable optimize`

**[P3] Mobile's only derivation-panel affordance is a 14px muted icon**
- **What**: `ContractCard`'s only visible cue that the whole card opens a derivation sheet is a `ScrollText` icon at `h-3.5 w-3.5 text-muted-foreground/60` — no border, chevron, or visible label; the full instruction exists only in a screen-reader-only `aria-label`.
- **Why it matters**: mobile is the stated primary reading context, yet this is a weaker discoverability signal than the desktop row gets (chevron + row hover) — worth confirming live since this session's mobile capture was blocked by a dev-cache crash.
- **Fix**: verify on-device; consider a more standard affordance (chevron, or a faint "toca para ver detalle" caption) instead of relying on one small low-contrast icon.
- **Suggested command**: `/impeccable clarify`

## Persona Red Flags

**Alex (Power User)**: Sorting by Margen or Vol/día to hunt the actual best play silently scopes to the plata/día top-300 (P0) — Alex will build strategy on an incomplete ranking without ever knowing it's incomplete. Alex also hits the 10-row pagination wall hardest, being the persona most likely to want to scan the full 300 rather than stop at row 10.

**Jordan (First-Timer)**: The derivation panel and "¿Qué hace el bono de ciudad?" disclosure are genuinely good on-ramps for a newcomer to the game's specialty-city mechanic. But a first-timer has no way to know the sort headers only cover a pre-filtered subset (P0) — a plain "Margen ↓" header reads as a full catalog sort to someone with no reason to suspect otherwise.

**Sam (Accessibility-Dependent)**: Labeled `NumberField`s, an `aria-live` recalculation region, `role="alert"` errors, and `aria-pressed` toggles are solid. But the diluted One Coin Rule (P1) means gold stops reliably signaling "active/important" across the page — a real cost for anyone leaning on color semantics rather than spatial memory to parse state.

## Minor Observations

- Global `:focus-visible` uses `outline: 2px solid var(--money)` — a fifth, undocumented use of the coin accent; reasonable on its own (focus rings commonly borrow the brand color) but worth reconciling with DESIGN.md's "reserved for exactly two/four things" language if that list is meant to be exhaustive.
- `ServerBadge` disabling Europe/Asia with "(sin datos todavía)" instead of hiding them entirely is a good honesty pattern, consistent with "never smooth over stale/missing data."
- `RowDetail`'s "Abrir en la calculadora" cross-page link reuses the same `border-money/50 bg-money/10 text-money` pill styling as `ActiveFilterChips`, so a genuinely distinct navigation action visually blends into the same diluted-gold noise as an ordinary filter chip.
- Page counter, sort icons, and numeric stats consistently apply `font-mono tabular-nums` — the Geist Mono rule is followed well throughout the row and detail components.
- The dev-cache 500 that interrupted Assessment B's mobile/derivation/Filtros captures is environmental (stale Turbopack `.next` manifests), not a source defect — `/es/equipo` reloaded cleanly on a fresh navigation after the dev server restarted.

## Questions to Consider

1. If sorting by Margen doesn't actually search the full 5,711-recipe catalog, should the header even read as a plain "Margen ↓," or does it need to say something like "Margen (dentro del top 300 por plata/día)" to stay honest with the tool's own "trust the derivation" premise?
2. Now that gold appears on filter section titles, every active chip, the recalculating pill, and focus rings in addition to the four documented uses, is the One Coin Rule still being enforced, or has it quietly become "gold is our accent color"?
