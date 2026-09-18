---
target: Filtros y supuestos panel (controls.tsx)
total_score: 21
max_score: 36
na_heuristics: 10
p0_count: 0
p1_count: 2
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\components\\recipes\\controls.tsx"
target_fingerprint: "sha256:cc592d2346c2923d03ad28dc9bd7a1917d24b4e5483316b33390325f23eba9df"
target_path: "D:\\Proyectos\\AlbionData\\src\\components\\recipes\\controls.tsx"
timestamp: 2026-09-18T02-21-54Z
slug: src-components-recipes-controls-tsx
---
Method: dual-agent (A: af644a46a078eac77 · B: a78794af6fc8a8825)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | List recomputes live and correctly (verified), but nothing flags "N supuestos changed" |
| 2 | Match System / Real World | 3 | Domain terms are correct but "% cuota de mercado" doesn't explain what it multiplies |
| 3 | User Control and Freedom | 3 | A defaults-reset link exists, but no per-field undo and every change applies immediately, live |
| 4 | Consistency and Standards | 2 | Internally fine, but now visually stale next to the Cinzel/wax-seal chrome around it |
| 5 | Error Prevention | 1 | Numeric fields have no visible min/max enforcement — confirmed live: `9999`% and `-500` fee both silently accepted |
| 6 | Recognition Rather Than Recall | 3 | Labels sit directly on controls; accessible names correctly wired (`htmlFor`/`useId`, confirmed in a11y tree) |
| 7 | Flexibility and Efficiency | 2 | No quick presets ("select all cities"); same 14 checkboxes retyped every session |
| 8 | Aesthetic and Minimalist Design | 3 | Reasonably lean except one long explainer paragraph mid-panel |
| 9 | Error Recovery | 1 | Confirmed: invalid numeric input is silently swallowed with zero inline feedback, no `aria-invalid` |
| 10 | Help and Documentation | n/a | No contextual help/tooltip affordance anywhere in the panel |
| **Total** | | **21/36** | **Acceptable (58%)** |

## Design Specificity Verdict

**LLM assessment**: Reads as a generic filter-sidebar-in-a-Sheet, not something built for a player about to act on real silver. The two city checklists (buy/sell) are visually identical — only a heading tells them apart, despite representing opposite financial direction. The Black Market callout is the one control with real domain-specific risk framing; nothing else in the panel matches that bar.

**Deterministic scan**: The CLI detector found **0 issues** on `controls.tsx`/`recipe-explorer.tsx` in isolation (exit 0). A live browser overlay found **29 anti-patterns**, but page-wide across the whole `/alquimia` route (header, item icons, recipe rows included) — not attributable specifically to these two files, since the overlay doesn't scope by component. Treat that count as evidence about the page, not a defect count for this critique's target.

**Visual overlays**: Injection ran live this session; findings above came from that console output.

## Overall Impression

The panel's actual mechanism is solid — live recompute is fast, correct, and the accessibility wiring (labels, focus rings, tab order) is genuinely better than average. But it trusts the user completely: two numeric fields accept nonsense (`9999%`, `-500` silver) with zero feedback, and there's no way to tell, at a glance, which of ~16 controls differ from the safe default before you've committed to trusting the ranking that comes out the other end.

## What's Working

- **Live recompute is fast and correct** — verified end-to-end: dropping market share and toggling focus off cut plata/día by the expected ~10x.
- **Accessibility wiring is solid**: every control has a correctly associated label, and keyboard tab order matches visual layout with a visible focus ring throughout.
- **The Black Market callout** (`controls.tsx:76`) is genuine domain-specific risk framing — the template the rest of the panel should match, not the exception.

## Priority Issues

**[P1] Numeric fields accept invalid values with zero feedback** — confirmed live: typing `9999` into "Cuota de mercado (%)" or `-500` into "Tarifa de estación" is silently accepted, no clamp, no error state, no `aria-invalid`. A player could unknowingly rank recipes off a nonsense assumption. Fix: clamp on blur or show an inline error. → `/impeccable harden`

**[P1] No changed-vs-default indicator anywhere** — neither the Filtros trigger nor individual fields show which supuestos differ from baseline; a user can't tell what's non-default without re-opening and comparing from memory. Fix: badge the trigger when params ≠ defaults; highlight changed fields. → `/impeccable clarify`

**[P2] Buy/sell city checklists are visually indistinguishable** — same 7-checkbox grid twice, differentiated only by an `<h3>`. Fix: tie each grid to the money/spend semantics already in the app (e.g. an accent border or icon per direction). → `/impeccable colorize`

**[P2] A dense explainer paragraph interrupts scanning** — the city-specialty prose (`controls.tsx:92-96`) sits mid-panel between two live inputs. Fix: move to a tooltip/info-icon disclosure. → `/impeccable clarify`

**[P3] Panel chrome now reads stale next to the recently updated header/wordmark** — plain `font-heading` section titles sit under a Cinzel/wax-seal shell. Not urgent (a Sheet of live inputs isn't a page title), but a light touch (e.g. reusing the `border-double` motif already on the Sheet's own edge) would stop it feeling bolted-on. → `/impeccable polish`

## Persona Red Flags

**Jordan (first-timer)**: Sees two identical 7-checkbox grids and likely misreads which is buy vs. sell, especially since both default to all-checked with no visual hint of intent.
**Sam (accessibility-dependent)**: Labels and focus order are genuinely solid, but gets zero signal — visual or `aria-invalid` — when a numeric entry is silently rejected.
**Casey (distracted mobile user)**: The "Restaurar valores por defecto" reset sits at the very bottom of a long scroll (16 checkboxes + 2 sections); fat-fingering a filter mid-scroll means scrolling past everything to undo it.

## Minor Observations

- The mobile trigger's `border-double` and the Sheet's `border-t-2 border-double` edge are a nice restrained callback to the wax-seal motif without overcommitting.
- "Tarifa de estación" represents silver but carries no currency unit in the field itself.
- Assessment B's desktop screenshot was captured at the Browser pane's native ~375px width (a `resize_window` call didn't take effect), so wide-desktop layout wasn't independently re-verified this run — flagged as an environment gap, not a finding.

## Questions to Consider

- Should "Restaurar valores por defecto" become a persistent, always-visible action rather than buried at scroll-bottom, given how consequential these numbers are?
- Is 7+7+1 discrete city checkboxes the right interaction, or would multi-select chips/regions cut the scan cost for the common case (most players buy/sell in 1-2 cities, not all seven)?
- Now that the page chrome has a clear visual language (money/wax-seal/double-border), should the panel's changed-vs-default state borrow the `money` token to make "this differs from baseline" legible at a glance?
