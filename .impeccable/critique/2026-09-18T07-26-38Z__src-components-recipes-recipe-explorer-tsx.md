---
target: recipe explorer (ranked-list page)
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\components\\recipes\\recipe-explorer.tsx"
target_fingerprint: "sha256:15ad4e32d6a849c549654d9e46a1f6e1330a1dc0f8ba4d197cb1baad8563155b"
target_path: "D:\\Proyectos\\AlbionData\\src\\components\\recipes\\recipe-explorer.tsx"
timestamp: 2026-09-18T07-26-38Z
slug: src-components-recipes-recipe-explorer-tsx
---
Method: dual-agent (A: aebbb757781f8d228 · B: a8043e632579fa748), plus my own spot-check of two flagged claims before finalizing.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Chips + URL sync are strong; the `isPending` "Recalculando..." caption is thin for a 10-20s wait on /equipo |
| 2 | Match System / Real World | 4 | Authentic terminology and real per-city faction colors throughout |
| 3 | User Control and Freedom | 3 | Reset-to-defaults, clearable chips, search-clear all present; sort/filter changes silently reset to page 1 |
| 4 | Consistency and Standards | 3 | Chip/badge language is consistent app-wide |
| 5 | Error Prevention | 3 | `NumberField`'s clamp + "Ajustado a X" remains genuinely good |
| 6 | Recognition Rather Than Recall | 3 | Chips are a real recognition win; mobile still needs the Sheet open to edit the underlying value |
| 7 | Flexibility and Efficiency | 3 | URL-shareable state and the new name search are real power-user wins |
| 8 | Aesthetic and Minimalist Design | 3 | Dense table stays coherent |
| 9 | Error Recovery | 2 | Confirmed bug: filtered-to-zero results show the wrong empty-state message |
| 10 | Help and Documentation | 3 | The city-bonus `<details>` disclosure remains well-scoped |
| **Total** | | **30/40** | **Good** |

Up from 27/40 on the previous run.

## Design Specificity Verdict

Still authored, not generic -- Faction Banner colors now trace consistently from the header selector through the filter chips into the table's "Ciudad bono" stat and the derivation panel's discarded-city list, all from the same `CITY_THEMES` source. The new name-search field's copy and placement read as intentional, not bolted-on. Deterministic scan on the 7 touched files is clean (`detect.mjs` exit 0, zero findings); previously-suppressed `border-accent-on-rounded` on the tab-underline pattern in `site-header.tsx` isn't re-flagged. A live-DOM injection reported 25 `ai-color-palette` + 10 `dark-glow` findings -- almost certainly the same Faction Banner colors and the plata/dia glow, both named exceptions in DESIGN.md; not re-litigated here, but DESIGN.md's Faction Banner Rule text still says the palette is "confined to the city selector," which is now out of date since the filter chips carry it too (an explicit, approved change from the last session, not a bug -- just a doc that hasn't caught up).

## Verifying two flagged claims myself

Assessment A raised two high-severity claims I checked directly before including them:

- **"FAB overlaps content" (claimed P1)**: loaded /alquimia at 375px and confirmed the fixed filter button does sit over row content mid-scroll. But that's true of every fixed-FAB pattern that exists -- content scrolling under a fixed button during scroll isn't a defect. Scrolled to the actual end of the 10-row page and confirmed the `mb-20` clearance from the last pass works correctly: the FAB sits clear of the pagination footer with no overlap. **Downgraded to no issue** -- the real edge case (FAB permanently obscuring un-scrollable content) is already handled; the mid-scroll transient isn't one.
- **"Wrong empty-state copy for filtered zero-results" (claimed P1)**: confirmed real. Searched "zzzznoexiste" on /alquimia: got "Mostrando 0 de 174 recetas" with a correct dismissible chip, but the table body says "Todavía no hay recetas cargadas. El ingester corre por hora -- volvé a mirar en un rato" -- telling the user to wait an hour for an ingest cron when the actual cause is their own search term. Directly contradicts PRODUCT.md's own "never smooth over a data gap" principle. **Confirmed, kept as P1.**

## Overall Impression

Every fix from the last critique landed and holds up under independent re-verification (header overlap gone at 650-1023px via exact rects, touch targets confirmed effectively >=44px via `::after` hit-area measurement, URL/chip state confirmed working end-to-end). The one real regression is a copy bug reachable only because the name-search field didn't exist during the last pass -- not something the fix pass broke, but something nobody looked at since it shipped independently.

## What's Working

1. **ActiveFilterChips + URL sync** closes both previously-flagged gaps in one mechanism, verified end-to-end (toggle -> chip appears -> reload -> state restores).
2. **Touch-target hit-area technique**, independently re-measured: hamburger 36px box / 52px effective, city selector 32px / 48px effective, sort pills 26px / 46px effective, pagination 36px / 48px effective -- correctly applied everywhere without inflating the dense visual design.
3. **Faction Banner carried into the table** (recipe-row.tsx's "Ciudad bono" stat and discarded-city list) closes the identity gap from the prior run without spreading the palette indiscriminately.

## Priority Issues

**[P1] Filtered-to-zero results show the wrong empty-state message**
Why: recipe-table.tsx's `rows.length === 0` branch unconditionally shows the "wait for hourly ingest" message, but `rows` is the post-filter set -- a search typo or a strict volume/age filter gets told to wait an hour, contradicting the product's own "never smooth over a gap" principle. Confirmed live.
Fix: branch on `recipes.length === 0` (true empty) vs. filtered-to-zero; give the latter "No hay coincidencias -- probá otro término" with a one-click reset.
Command: /impeccable clarify

**[P2] Name search is buried behind the FAB+Sheet on mobile, the page where it matters most**
Why: PRODUCT.md names mobile as the primary context, and /equipo (~5,632 rows) is exactly where "find my item" beats paging -- yet the field needs two taps (open Sheet, then type) to reach.
Fix: consider promoting it to an always-visible field on mobile, independent of the Filtros Sheet.
Command: /impeccable layout

**[P2] `xl:`-only column breakpoint leaves a 1024-1279px dead zone**
Why: the two-column layout and widened container activate at `lg:` (1024px), but Costo/Precio venta/Ciudad bono wait until `xl:` (1280px) -- a ~256px range where the desktop layout is "half-arrived."
Command: /impeccable layout

**[P3] Pending-state affordance stays thin for the wait it covers**
Why: a caption word plus 60% opacity dim is the entire signal for a recompute PRODUCT.md measures at 10-20s on /equipo.
Command: /impeccable polish

## Persona Red Flags

**Riley (stress-tester)**: types a nonsense query and is told, incorrectly, to wait an hour for fresh data -- a real trust breach for a product whose whole pitch is not smoothing over gaps.

**Casey (mobile)**: has to fight through the Filtros Sheet to reach the control she'd reach for most on the page with the most rows.

**Alex (power-user)**: benefits from URL-state sharing, but rapid parameter tweaking against a 20s recompute with only a caption-level signal risks looking broken mid-session.

## Minor Observations

- `writeStateToUrl` fires on every keystroke in the name search (harmless, uses `replaceState`, but worth knowing).
- DESIGN.md's Faction Banner Rule text ("confined to the city selector") is now stale given the filter chips also carry city color -- a documentation update, not a defect, since that was an explicit, approved change last session.
- `ActiveFilterChips` has no cap and could grow to 5-6 chips; handled by `flex-wrap`, untested at the extreme but low risk.

## Questions to Consider

1. Should DESIGN.md's Faction Banner Rule be updated now that city color deliberately lives in two controls, or is a third spread (e.g. into row names) still off the table?
2. Is the /equipo recompute latency itself the next thing worth fixing (server-side computation, per PRODUCT.md's own open gap), rather than continuing to refine the loading affordance around it?
