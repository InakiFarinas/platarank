---
target: toda la pagina (homepage)
total_score: 16
max_score: 24
na_heuristics: 5,7,9,10
p0_count: 1
p1_count: 2
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\page.tsx"
target_fingerprint: "sha256:347b6e62efc69cb34fa9286a56d2e7cd101dc9abdc3116d76086d06e3882965e"
target_path: "D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\page.tsx"
timestamp: 2026-09-18T02-02-27Z
slug: src-app-locale-page-tsx
---
Method: dual-agent (A: a44fd18560265322a · B: a50b29723b4d4a292)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Hover/focus states present; no active-page indicator beyond the "Inicio" underline |
| 2 | Match System / Real World | 3 | Coin/wax-seal/guild metaphors map cleanly onto Albion's crafting-guild framing |
| 3 | User Control and Freedom | 3 | Sticky nav everywhere, no dead ends |
| 4 | Consistency and Standards | 2 | Internally consistent, but the page's rich gold/crest/wax-seal language now diverges from the app's plainer "guild ledger" system (see Design Specificity) |
| 5 | Error Prevention | n/a | Static page, no inputs |
| 6 | Recognition Rather Than Recall | 3 | Station cards repeat icon+label+count consistently |
| 7 | Flexibility and Efficiency | n/a | No power-user path applies to a static landing page |
| 8 | Aesthetic and Minimalist Design | 2 | Four sections repeat "gold badge, title, one-liner" — visually rich, informationally thin per section |
| 9 | Error Recovery | n/a | Nothing to fail on a static page |
| 10 | Help and Documentation | n/a | Not applicable to a landing page |
| **Total** | | **16/24** | **Acceptable (67%)** |

## Design Specificity Verdict

**LLM assessment**: Mostly generic. Wax seals, shield-shaped icon badges, dashed "rule-fleur" dividers, and small-caps Cinzel headers are stock medieval-SaaS furniture — nothing here couldn't sell a fantasy card game or a wedding site. The one thing that IS Albion-specific is the mock ledger table (real potion names, plata/dia figures) — it's carrying all of the "this is for Albion players" weight alone. The hero illustration is an explicit placeholder per its own code comment ("no photoreal art available"), and it reads as one: a generic ridge-and-keep silhouette.

**Deterministic scan**: The static CLI detector (`detect.mjs`) found **0 issues** across all 5 changed files (exit 0). The live browser-overlay detector found **7 anti-patterns**: 1x `clipped-overflow-container` (hero section's `overflow-hidden`), 4x `body-text-viewport-edge` (paragraphs sitting at `left: 12px`), 1x `nested-cards`. Two of these are likely false positives: the 12px left offset matches the standard `px-3` container gutter rather than a true edge-bleed, and the hero's `overflow-hidden` exists specifically to contain a decorative diagonal background pattern, not to clip real content. `nested-cards` and the hero clipping deserve a quick visual double-check but aren't confirmed defects.

**Visual overlays**: Overlay injection succeeded live in the browser (not persisted as a standing script) — the 7 findings above came from that run's console output, not from a static claim.

## Overall Impression

The redesign nails the *ceremonial* half of "medieval" — banners, wax seals, shields, a coin-gold accent — and the hero-to-CTA moment is genuinely strong (bold headline, concrete trust stats right under the button). But it's decoration in search of specificity: strip the copy and this could be any guild/fantasy SaaS landing page, and the one real mobile-usability regression (the ranking table's column headers vanish on phone) undercuts the page's single most persuasive piece of proof for the audience that matters most — people checking this one-handed next to the game.

## What's Working

- **Hero → stats → CTA sequencing**: headline, gold CTA, and the `6.072 / 4 / 24-7` stat row land in the right order and give a skeptical player a concrete reason to trust the ranking before asking for a click.
- **The "Pergamino de Alquimia" ledger card**: real potion names and silver figures inside a double-ruled parchment frame is the one moment the medieval framing and the actual product data reinforce each other instead of just decorating around it.
- **Station-card hover state**: border brightening + arrow micro-shift is a tasteful, low-cost interaction that doesn't overreach.

## Priority Issues

**[P0] Mobile ledger table loses its column headers**
Why it matters: `MOCK_ROWS`' header row (`Receta / Plata-dia / Margen / Volumen`) is `hidden ... sm:grid`, so on a phone the numbers 412.350 / 1.240 / 320 render with zero labels. For the mobile-first audience this app is built for, the page's single strongest proof element becomes unreadable — a first-timer can't tell margin from volume from plata/día.
Fix: render compact/stacked labels below `sm:` instead of hiding the header row entirely, or restructure the mobile row as labeled key-value pairs.
Suggested command: `/impeccable adapt`

**[P1] Mobile header nav is effectively unreachable past "Alquimia"**
Why it matters: confirmed live at 390px — only "Inicio" and a truncated "Alquimi[a]" are visible before the "Ver ranking" button; Refinado/Cocina/Equipo exist in the DOM but aren't visible and there's no scroll affordance (fade, arrow, or hamburger) hinting more links exist. A first-time visitor on the primary device this product targets won't discover three of the four station links from the header.
Fix: add a fade mask or scroll-shadow cue on `overflow-x-auto`, or collapse to a menu button below a breakpoint.
Suggested command: `/impeccable adapt`

**[P1] Long recipe names truncate in the page's own curated demo data**
Why it matters: "Pocion de invisibilidad" already clips to "Pocion de invisibil…" on a 390px screen in mock content the team fully controls (`truncate` class); real recipe names run longer. This is a visible edge-case failure inside the page's own showcase, not a hypothetical.
Fix: wrap to two lines or pick mock copy that actually fits the column width.
Suggested command: `/impeccable harden`

**[P2] The one bespoke visual (HeroIllustration) is invisible to the primary audience**
Why it matters: `HeroIllustration` is `hidden lg:block`, so on phone — this product's stated primary reading context — the hero is text + button only, and the flagship "medieval" visual never appears for the users who matter most.
Fix: ship a small crest/seal motif or a cropped illustration at `sm:`, don't cut it to zero.
Suggested command: `/impeccable adapt`

**[P3] Three consecutive sections restate the same "volume, not just margin" pitch**
Why it matters: the hero subhead, the feature grid ("no solo margen, tambien volumen"), and the checklist ("no del mercado") all re-explain the same differentiator before the user ever reaches the four station links, diluting momentum toward the CTA.
Fix: cut the feature grid or the checklist down to whichever carries new information; let the other one go.
Suggested command: `/impeccable distill`

## Persona Red Flags

**Casey (distracted mobile user)**: Hits the ledger table mid-scroll and sees three bare numbers with no headers — the entire "plata/día, not just margin" differentiator fails to land because the proof is illegible. Likely bounces before reaching the station cards. Also loses 3 of 4 nav destinations in the clipped header.

**Jordan (first-timer)**: Told "Calculo detallado" and "todas las formulas" exist, but the landing page itself never walks through one worked example tying plata/día to margin × volumen — the promise is stated, not demonstrated.

**Riley (stress tester)**: Finds the nav overflow clipping immediately, notices the only trust/affiliation disclaimer ("no afiliada a Sandbox Interactive") sits in low-contrast footer text easy to miss on a first visit — exactly when trust is being decided — and questions why the flagship hero visual disappears under `lg`.

## Minor Observations

- The wax-seal glyph beside the hero CTA is purely decorative with no functional meaning (not a badge/certification) — mild unexplained clutter.
- The header's wax-seal logo mark and the CTA-area wax-seal render as the same asset but at different visual weight/framing; worth a consistency pass if the mark is meant to be a recurring brand element.
- `body-text-viewport-edge` and `clipped-overflow-container` overlay findings are probably false positives (standard gutter padding; intentional decorative clip) but worth a 30-second visual confirmation since they weren't independently verified against the live-rendered layout.

## Questions to Consider

- Is the richer gold/crest/wax-seal language on this page meant to feel more ceremonial than the plainer in-app "guild ledger" screens it leads into (a deliberate lobby-vs-workspace split), or should the two be brought back into one system?
- Given real users check this on a phone next to the game, is a static hero illustration the best use of that space at all, or would a live/richer data preview convert better?
- Would collapsing the feature-grid and checklist sections (which currently repeat the same claim three times) get users to the four station links — the actual product — faster?
