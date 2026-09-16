---
target: "critique (recipe ranking surface: alquimia/refinado/cocina/equipo)"
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\alquimia\\page.tsx"
target_fingerprint: "sha256:2c9f1f626e07d357e480c7bda5d6c973102990724234cc68a96d2c651245786a"
target_path: "D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\alquimia\\page.tsx"
timestamp: 2026-09-16T09-01-34Z
slug: src-app-locale-alquimia-page-tsx
---
Method: dual-agent (A: ac81f536d7e112f1e · B: a0bfd4af8de508d89)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | "Mostrando X de Y recetas" and active sort chip give status; no visible loading skeleton observed for initial fetch |
| 2 | Match Between System and Real World | 4 | Terminology (foco, cuota de mercado, "Brecilien cotiza este ítem") matches player mental model exactly |
| 3 | User Control and Freedom | 3 | Filters/sort are easy to change, but no "reset to defaults" affordance once assumption params are edited |
| 4 | Consistency and Standards | 3 | Faction-color exception is well-scoped, but the mobile nav-tab overflow breaks the standard "current page visible in nav" expectation |
| 5 | Error Prevention | 3 | Quality-weights field allows a sum far from 100% with only a passive note, no hard guard |
| 6 | Recognition Rather Than Recall | 3 | Row → detail mapping is consistent across desktop/mobile; nav tab hidden off-screen forces recall of location |
| 7 | Flexibility and Efficiency of Use | 2 | Assumption params are genuinely power-user flexible, but no saved presets/URL state, no keyboard sort shortcuts |
| 8 | Aesthetic and Minimalist Design | 4 | Dense but uncluttered; ornament confined to chrome per DESIGN.md's own rules |
| 9 | Help Users Recognize/Recover from Errors | 3 | "datos insuficientes" badge is clear per-row; empty-filter-result state not verified live |
| 10 | Help and Documentation | 3 | Inline explanatory copy (city-bonus rule, quality-weight sourcing) substitutes for a help doc effectively for this Operate tool |
| **Total** | | **31/40** | **Good** |

## Design Specificity Verdict

**LLM assessment:** This reads as authored for Albion, not a reskinned data grid. The derivation panel's vocabulary -- "Retorno asumido 25% (con especialidad (Brecilien), sin foco)", "Fee de estación (lote)", "Q5 Obra maestra -- sin liquidez, no cuenta" -- is domain-specific enough that a generic table clone would be visibly wrong. The city selector's Faction Banner Rule (8 saturated per-city colors + flat emblem glyphs) is a genuinely bold, product-specific move: Albion players already associate these hues with the in-game factions, so the exception reads as recognition, not decoration. The double-ruled hairline motif and IM Fell English headline face are more generic "old ledger" signifiers that could belong to many products, but they're deployed narrowly enough (chrome only) that they don't fight the data-dense core. Specific where it counts (the numbers, the city system), generic-but-restrained where it's just atmosphere.

**Deterministic scan:** `detect.mjs` returned zero findings (exit 0) across every ranked-list surface file, including the new `city-theme.ts`/`city-emblems.tsx` system. No false positives to report because there was nothing to evaluate -- the mechanical checks (border/radius clashes, off-ramp font sizes, banned patterns) are clean. This says nothing about the heuristic/persona issues below; those are outside what a deterministic scanner can see.

**Visual overlays:** No live browser overlay was injected this run (script-injection overlay flow was not exercised); Assessment B instead captured direct screenshots and a console/network read at desktop and mobile widths, described below.

## Overall Impression

The core browsing loop -- scan ranked list, spot a promising plata/día figure, tap to verify the derivation -- is genuinely low-friction and well-suited to its "phone next to the game" use case. The single biggest opportunity is wayfinding on mobile: the one piece of chrome whose entire job is "tell the user where they are" (the rubro tab row) can scroll its own active tab off-screen with no affordance that more tabs exist.

## What's Working

- **The Pergamino Sheet reuses `RowDetail` verbatim** (not a squeezed mobile copy) -- desktop and mobile tell the exact same trust story, nothing is dumbed down for phone.
- **Quality Gems** compress a 5-row textual breakdown into a glanceable diamond strip that still explains itself on hover/long-press -- a well-judged progressive-disclosure device for gear rows.
- **Discarded-outlier transparency** (`descartado: precio anormalmente bajo (posible bait)`) builds real credibility for a silver/day number players will act on financially -- confirmed live in the derivation sheet.

## Priority Issues

- **[P1] Active nav tab can scroll off-screen on mobile with no affordance.** On `/es/equipo` at 375px, the "Equipo" tab can sit outside the visible area of the `overflow-x-auto` nav row in `recipe-header.tsx`, with no fade mask, arrow, or scroll-into-view-on-mount to hint more tabs exist or confirm which one is active. A first-timer arriving via a shared link has no visual confirmation of location beyond the `<h1>` text. **Fix:** scroll the active tab into view on mount, or add a fade-edge mask to the scroll container. **Suggested command:** `/impeccable adapt`

- **[P1] Quality label truncates while its value wraps, breaking alignment.** In the Pergamino Sheet's "Por calidad" list (`recipe-row.tsx` ~line 212), `Q5 Obra maestra (0%)` truncates under `className="truncate"` while its illiquid-price value can still wrap to a second line, misaligning the row. Confirmed still present (not touched by other recent edits). **Fix:** drop truncation for quality labels -- they're short, bounded strings (`Q5 Obra maestra` max) -- or abbreviate to `Q5` with the full name in a tooltip. **Suggested command:** `/impeccable adapt`

- **[P2] Filtros sheet has almost no internal structure for 9+ distinct controls.** Two city checklists, a Black Market note, a focus switch, an explanatory paragraph, quality weights (gear only), market share, station fee, and two age/volume filters all sit in one flat scroll with only two `Separator`s (`controls.tsx`). A returning player scanning for "where's the volume filter" scrolls past every assumption control first. **Fix:** group into two labeled sections or an accordion -- "Supuestos" vs. "Filtros" -- so the two different jobs this sheet does (assumptions vs. filters) are visually distinct. **Suggested command:** `/impeccable layout`

- **[P3] No reset-to-defaults affordance for assumption params.** Once a player edits market share or quality weights, there's no visible way back to defaults short of a full page reload (state is a plain `useState(DEFAULT_PARAMS)` in `recipe-explorer.tsx`). **Fix:** a small "restaurar valores" text action in the Filtros sheet footer. **Suggested command:** `/impeccable clarify`

- **[P3] Quality Gems' liquidity signal relies on a `title` attribute alone.** `title` tooltips don't fire on touch and aren't reliably announced by mobile screen readers, so the liquid/illiquid distinction in `QualityGems` (`recipe-row.tsx`) is effectively color/shape-only for a touch+assistive-tech user, with no accessible-name fallback. **Fix:** add `aria-label` per gem mirroring the existing `title` text. **Suggested command:** `/impeccable harden`

## Persona Red Flags

**Jordan (first-timer):** Lands on `/es/equipo` on a phone, can't see "Equipo" highlighted anywhere in the visible nav (P1 above) -- has to trust the `<h1>` alone to confirm navigation worked.

**Casey (distracted mobile thumb-user):** The Filtros trigger is a good one-handed fixed FAB, but the sheet it opens front-loads two full-width city checklists before the filters Casey actually came for (antigüedad/volumen) -- by the time a distracted one-handed user scrolls past the assumption controls to reach the two filter fields at the bottom, they may give up. Reinforces the P2 sectioning issue above.

**Sam (accessibility):** Quality Gems' liquidity meaning is conveyed by a `title` attribute that doesn't reach touch or most mobile screen-reader flows (P3 above). Separately, Assessment B confirmed the desktop row's expand button and the Filtros sheet's number fields do carry real `aria-expanded`/`aria-controls`/`<label htmlFor>` wiring in the current code -- so this persona's experience is mixed, not uniformly bad: the primary expand interaction is now properly exposed to assistive tech, but the gear-only Quality Gems still are not.

## Minor Observations

- Nav tabs and the Filtros FAB use hover-only cues (`hover:text-foreground`, `hover:bg-accent/60`) with no focus state visibly distinct from hover for keyboard users.
- The per-city bonus badge logic in the dropdown (only cities with a real specialty for the current rubro's categories get a badge) was confirmed correct live on `/alquimia` -- appropriately sparse, not a placeholder-everywhere pattern.
- Assessment B observed the mobile `/equipo` list briefly rendering empty immediately after navigation before rows painted; a short wait resolved it. Likely virtualization/hydration timing under dev-mode fast refresh rather than a production defect, but worth a quick production-build sanity check given ~5,632 rows on that page.
- No console errors, hydration warnings, or failed item-icon CDN requests were observed during Assessment B's session.

## Questions to Consider

- If quality-weight inputs are meant to capture "your current spec/food," should they persist per-browser (localStorage) instead of resetting every session, given the copy explicitly tells players to look up and enter their own numbers?
- Is the Filtros sheet's flat, single-scroll structure earning its simplicity, or would splitting "supuestos" from "filtros" pay for itself the first time a player has to find the volume filter under a pile of city checkboxes?
