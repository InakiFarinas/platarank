---
target: recipe explorer (ranked-list page)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\components\\recipes\\recipe-explorer.tsx"
target_fingerprint: "sha256:9abbde7b7d272df706526addca18527553687e6af71203bb7efe1d0c64590e57"
target_path: "D:\\Proyectos\\AlbionData\\src\\components\\recipes\\recipe-explorer.tsx"
timestamp: 2026-09-18T06-46-21Z
slug: src-components-recipes-recipe-explorer-tsx
---
Method: dual-agent (A: a053c38032e741e8d · B: a1e33ad58f22dd81b)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Counts/pagination are honest and live, but no loading/pending state during client-side recompute (measured 10-20s+ stall on /equipo per PRODUCT.md) |
| 2 | Match System / Real World | 3 | Game-literate Spanish vocabulary throughout; "Contract Card"/"contrato" is an invented metaphor not grounded in the game itself |
| 3 | User Control and Freedom | 3 | "Restaurar valores por defecto" exists; no deep-linkable/shareable filter+sort state, everything resets on reload |
| 4 | Consistency and Standards | 3 | Desktop/mobile sort controls diverge in form (buttons vs. scrollable pills) by design; pagination has no page-jump |
| 5 | Error Prevention | 3 | `NumberField`'s clamp-and-explain (controls.tsx:335-356) is genuinely strong; no visual distinction for required vs optional fields |
| 6 | Recognition Rather Than Recall | 2 | `xl:`-only Costo/Precio venta/Ciudad bono columns (recipe-table.tsx:70) vanish below that breakpoint with zero affordance; active filters aren't shown outside the panel |
| 7 | Flexibility and Efficiency | 2 | No saved presets, no URL state, no keyboard shortcuts, no "select all/none" on 8-city chip groups |
| 8 | Aesthetic and Minimalist Design | 3 | Row density is disciplined; desktop header nav is visibly cramped (site-header.tsx's own comment admits the Server badge is hidden below `sm:` because it doesn't fit) |
| 9 | Error Recovery | 3 | `role="alert"`/`aria-describedby` wiring is correct; "datos insuficientes" and discard-reason copy match the product's derivation-first pitch |
| 10 | Help and Documentation | 2 | Only one inline explainer exists ("¿Qué hace el bono de ciudad?"); market-share/station-rate/quality-blend logic — the app's actual complexity — has none |
| **Total** | | **27/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment**: The chrome is genuinely authored — wax seal, Cinzel wordmark, double ruled dividers, and the faction-colored city Select in the header are distinctive and specific to "guild ledger / Albion Online." But that authorship stops at the frame. The table (`recipe-table.tsx`), its sort controls, and pagination footer are structurally identical to any generic B2B data-table product. More tellingly, the city filter chips in `controls.tsx`'s `CitySection` render all 16 buy/sell city toggles in the same flat gray-to-gold state, with zero reuse of `CITY_THEMES` — the exact per-city color/emblem system the header's own city Select already uses two components away. That's not just a missed specificity opportunity, it's an internal inconsistency: a player learns "Thetford = purple" from the header and gets nothing for that mental model in the filters. DESIGN.md's own stated thesis ("ornament lives in chrome only, data rows stay dense/unadorned") makes this a deliberate ceiling, not an oversight — but it does mean the product's actual emotional peak (a huge plata/dia number at rank #1) is delivered in the same visual voice as row #50 and the filter footer.

**Deterministic scan**: The static CLI scan (`detect.mjs --json`) on all 6 target files (recipe-explorer.tsx, recipe-page.tsx, site-header.tsx, controls.tsx, recipe-table.tsx, recipe-row.tsx) returned **zero findings** (exit 0). Three pre-existing suppressions exist in `.impeccable/config.json`, all for `border-accent-on-rounded` on the tab-underline nav pattern (`rounded-t-sm` + `border-b-2` as an active-tab indicator, not a card-border clash) — confirmed false positives from earlier sessions, not re-flagged here.

**Visual overlays**: Live-DOM injection succeeded (script mutation confirmed, `live-server.mjs` served `/detect.js` into the running page) and reported **20 anti-patterns** across the whole rendered `/es/alquimia` page (not scoped to the 6 target files, so some may originate in global layout/CSS rather than these components specifically):
- `ai-color-palette` ×6 — "purple/violet neon text on dark background." This is almost certainly the Thetford city theme's purple in `CITY_THEMES`/`city-theme.ts`, an explicit, named exception under DESIGN.md's Faction Banner Rule (per-city saturated color is intentional, scoped to exactly the city selector). **Likely false positive** — recommend suppressing this rule for that file/value if it keeps recurring, same pattern as the existing `border-accent-on-rounded` suppressions.
- `dark-glow` ×9 — "zero-offset text-shadow glow (#f9a129)." This matches the plata/dia hero-figure glow on the mobile Contract Card, which DESIGN.md explicitly calls out as a named exception ("a candlelit glow, not a drop-shadow-as-elevation... don't generalize it into an elevation device elsewhere"). **Likely false positive**, same reasoning — but 9 occurrences is more than "one hero number," worth spot-checking whether the glow leaked onto other elements beyond the intended one.
- `line-length` ×2 (~135 and ~100 chars/line) and `body-text-viewport-edge` ×1 (a 123-char `<p>` bleeding to 10px from the viewport edge) — these look like real findings, likely the footer attribution paragraph (`recipe-page.tsx`'s `<Footer>`) which isn't width-constrained the way the rest of the page now is after the recent edge-to-edge padding change. Worth a real fix, not a suppression.
- `overused-font` ×1 — "Geist Mono at 36% of text." Expected and intentional per DESIGN.md's Tabular-Nums Rule (every quantity renders in mono); not a defect.

**Mechanical browser evidence** (independent of the injected detector): all 22 `<img>` elements loaded with no broken images; no horizontal overflow at 375px mobile width. However, **mobile touch targets are undersized** against the 44px (iOS)/48dp (Android) baseline: the sort pills ("Plata/dia," "Margen," "Volumen") measure 26px tall, the hamburger menu button and pagination prev/next arrows are 36×36px, and the header city selector is 32px tall. This is a mechanical, measurable finding, not a matter of taste — several of these elements already use the codebase's own invisible-hit-area-expansion pattern (`after:absolute after:-inset-y-*`) elsewhere (`NavTab`, `PageButton`), so the fix is applying that same established pattern more consistently rather than inventing a new one.

## Overall Impression

The frame is confident and specific; the content inside it is competent but generic, and the two don't currently talk to each other where they could (city color identity). The bigger gap isn't taste, it's state: filters and sort settings vanish on reload with no visible trace in the main view, and touch targets on the exact device this product is designed for ("checked one-handed next to the game") fall short of platform minimums in multiple places. Nothing found is a P0 — the core derivation-panel experience, which is this product's actual differentiator, is genuinely well-built and matches its own stated positioning.

## What's Working

1. **The derivation panel (`RowDetail`, recipe-row.tsx)** — showing exactly which city prices were used or discarded and why (`DISCARD_REASON_LABEL`), with the illiquid-quality dashed-underline convention that survives grayscale. This is the product's stated differentiator, actually built, not just claimed in PRODUCT.md.
2. **`NumberField`'s clamp-and-explain UX** (controls.tsx:335-356) — commits on blur, clamps to range, and explains why ("Ajustado a X (mínimo permitido)") instead of silently correcting or hard-rejecting. Genuinely above-bar error prevention for a tool this size.
3. **The Faction Banner Rule's city Select** in the header — the one place "guild ledger" identity reaches into a working control (per-city color + emblem + bonus pill), not just static chrome. Specific, legible, functional.

## Priority Issues

**[P1] City filter chips carry zero city identity, breaking the app's own established pattern**
- **Why it matters**: The header's city Select (two components away) already uses `CITY_THEMES` for saturated per-city color + emblem glyphs on this exact same 8-city set. The filter chips in `CitySection` (controls.tsx) render every city identically gray-to-gold, so a player's learned color association from the header gets no payoff in the filter panel — an internal consistency break, not just a missed opportunity.
- **Fix**: Reuse `CITY_THEMES` for each chip's active-state border/text color (resting state stays neutral, matching how the One Coin Rule already rations color to active states elsewhere).
- **Suggested command**: `/impeccable colorize`

**[P1] No persistent indicator of active filters, and no shareable/persisted filter state**
- **Why it matters**: `filters` (maxAgeHours, minVolume) and city params can silently narrow "174 de 174" to some smaller N with only the count as a signal — no chip/badge states *what* is filtered. Combined with full state loss on reload (no URL sync), a returning player can't recall or share a tuned view, directly hurting the "power user tuning session parameters" persona in PRODUCT.md.
- **Fix**: Surface active filters as small dismissible chips above the table; sync `params`/`filters` to the URL query string.
- **Suggested command**: `/impeccable clarify`

**[P2] Mobile touch targets fall below platform minimums in several places**
- **Why it matters**: Measured directly in the browser: mobile sort pills are 26px tall, the hamburger button and pagination arrows are 36×36px, the city selector is 32px tall — all under the 44px/48dp baseline, on the exact "one-handed next to the game" device this product is built for.
- **Fix**: Apply the same invisible-hit-area pattern already used elsewhere in this codebase (`after:absolute after:-inset-y-*`, seen on `NavTab`/`PageButton`) to the sort pills, hamburger, pagination arrows, and city selector.
- **Suggested command**: `/impeccable adapt`

**[P2] `xl:`-only columns and cramped `sm`-`lg` header nav both stem from unresolved space pressure**
- **Why it matters**: Costo/Precio venta/Ciudad bono (recipe-table.tsx:70) disappear completely below `xl` with no affordance hinting they exist — a mainstream 1366px laptop never sees them. Separately, `site-header.tsx`'s own inline comment admits the Server badge is hidden below `sm:` "because it doesn't fit" alongside 4 nav tabs + city Select — a real-estate problem currently solved by hiding controls rather than resolving the crowding.
- **Fix**: Lower the `xl:` column breakpoint or note their existence elsewhere; collapse nav labels/pills earlier in the header before the wider columns get their own space budget.
- **Suggested command**: `/impeccable layout`

**[P3] No loading/pending affordance during client-side recompute**
- **Why it matters**: Per PRODUCT.md, changing any param away from defaults re-runs `computeRecipeRow` over every recipe client-side (measured 10-20+s on /equipo), but the table renders no skeleton/spinner/disabled state during that stall — a player just sees a frozen page.
- **Fix**: Add a lightweight `isPending` (React `useTransition`) indicator on the table region.
- **Suggested command**: `/impeccable polish`

## Persona Red Flags

**Casey (Mobile)**: The Contract Card and Pergamino Sheet are well-executed for the primary persona, but the measured touch targets above (26-36px on sort pills, hamburger, pagination, city selector) are a direct hit against "used one-handed next to the game." The horizontally-scrollable sort-chip row also has no visible scroll affordance beyond a thin native scrollbar, risking a player never discovering more sort options exist.

**Alex (Power User)**: Hit hardest by the missing persistent/shareable filter state — no URL sync, no keyboard shortcuts, and toggling 8 city chips per side with no "select all/none" shortcut is real friction for someone tuning session parameters repeatedly, which is exactly this persona's described behavior in PRODUCT.md.

**Sam (Accessibility)**: Mixed — `aria-expanded`/`role="alert"`/`aria-describedby` are correctly wired, better than average. But `QualityGems` (recipe-row.tsx) conveys liquid/dim state through color alone on 8px rotated squares, with no shape/pattern difference — the same "line not hue" principle DESIGN.md itself established (and applied correctly) for illiquid-quality prices elsewhere in the row detail. An inconsistency within the system's own accessibility rule.

## Minor Observations

- `formatCount`'s "5.6k" for Equipo is a hardcoded literal in `NAV_ITEMS` (5632), not derived from real data — will silently drift as gear recipes change.
- Pagination controls already use the invisible-hit-area pattern (`after:-inset-y-1`) — the fix for the P2 touch-target issue above is extending an existing pattern, not inventing one.
- "Página 1 de 18" has no page-jump; reaching rank ~171-174 takes 17 clicks.
- The `ai-color-palette` and `dark-glow` detector findings are most likely false positives against DESIGN.md's own named exceptions (Faction Banner Rule, wax-seal/plata-dia glow) — flagged for verification, not re-suppressed automatically, since 9 `dark-glow` hits is more than the "one hero number" the exception was scoped to.
- `line-length`/`body-text-viewport-edge` findings likely point at the footer attribution paragraph, which wasn't re-constrained when the page's outer padding was recently removed at `sm:` and up — worth checking whether it now runs edge-to-edge unintentionally.

## Questions to Consider

1. Should some of the "Guild Ledger" identity budget move from chrome into the row/table itself (city-colored filter chips, at minimum), or is "boring rows, exciting chrome" the intended trade for a tool used one-handed at speed?
2. Is granular per-city filtering (16 individual toggles) actually used, or would 2-3 named presets ("solo mi hub", "todas las ciudades reales") serve most sessions better?
3. Should the missing loading-state fix wait until `/equipo`'s known 10-20s recompute stall (an open, documented PRODUCT.md gap) is actually resolved, since surfacing more filter affordances just invites more of the exact interaction that currently freezes the page?
