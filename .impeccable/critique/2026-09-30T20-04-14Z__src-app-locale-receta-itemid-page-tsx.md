---
target: recipe detail page
total_score: 24
max_score: 36
na_heuristics: 5
p0_count: 1
p1_count: 1
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\receta\\[itemId]\\page.tsx"
target_fingerprint: "sha256:9fc84fe18c9fa39cdde63f850a78b29ea064a48857df6826bbc2af2040d4abf8"
target_path: "D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\receta\\[itemId]\\page.tsx"
timestamp: 2026-09-30T20-04-14Z
slug: src-app-locale-receta-itemid-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Data age shown, no loading state needed |
| 2 | Match Between System and Real World | 3 | Correct Albion/rioplatense terminology |
| 3 | User Control and Freedom | 3 | Clear paths to calculator and station ranking |
| 4 | Consistency and Standards | 1 | Plata/dia is not rendered in coin-gold anywhere on the page |
| 5 | Error Prevention | n/a | Static page, no input to validate |
| 6 | Recognition Rather Than Recall | 3 | Labels self-explanatory |
| 7 | Flexibility and Efficiency of Use | 2 | No quick re-derive with a different city without leaving the page |
| 8 | Aesthetic and Minimalist Design | 3 | Clean but flat/inconsistent section chrome |
| 9 | Error Recovery | 2 | A loss renders with zero negative framing (no color/icon) |
| 10 | Help and Documentation | 4 | FAQ + methodology link, schema-marked |
| **Total** | | **24/36 (1 n/a)** | **67% -- Acceptable** |

## Design Specificity Verdict

Mostly generic SEO-content-page template wearing the brand's header/footer chrome. The masthead and footer are shared components, so the page opens like PlataRank -- but everything below reverts to undifferentiated conventions: a prose paragraph, a plain `dl`, a bordered table, a pill list, an FAQ. It never reuses the product's own signature move -- the large coin-gold hero number every ranking row uses. Deterministic scan: CLI clean; live overlay found `line-length`x5 (92-121 chars/line on the summary paragraph and FAQ answers) and `cramped-padding`x2 (the calculator CTA, the materials table wrapper) -- both corroborate the "generic chrome" verdict.

## Overall Impression

A player Googles an item wanting one verdict, and instead meets a sentence to parse plus a ledger of stats with no visual point of emphasis. For a losing recipe specifically, nothing about color or weight signals "this loses money" -- trust is earned only by careful reading, not the confident at-a-glance verdict the ranking rows deliver.

## What's Working

- Derivation transparency is genuinely thorough and shares the exact data shape with the ranking row (quality breakdown, discarded outliers, cheapest-city sourcing) -- the "trust the derivation" promise is structurally intact.
- The insufficient-data state is honest, well-copywritten, and correctly suppresses the FAQ rather than showing empty questions; `robots: {index: false}` matches the sitemap's own test.
- SEO/AEO execution is solid: breadcrumb + FAQ JSON-LD, canonical URLs, technically disciplined.

## Priority Issues

**[P0] The page's core number isn't gold**
- Location: `src/app/[locale]/receta/[itemId]/page.tsx` -- the derivation `dl` maps every stat, including `silverPerDay`, through one generic `<dd className="font-mono tabular-nums">` with no `text-money`. Confirmed: `recipe-row.tsx` renders the identical value with `text-lg font-semibold tabular-nums text-money`.
- Why it matters: directly contradicts DESIGN.md's One Coin Rule on the one page built specifically to deliver that number to a cold Google visitor.
- Fix: give `silverPerDay` (and ideally `profitPerUnit`) its own larger, gold, bold treatment -- a real hero stat.
- Suggested command: `/impeccable colorize`

**[P1] No positive/negative framing on profit**
- Location: same `dl`, plus the summary paragraph. A loss and a gain render identically.
- Why it matters: the Foundry page already has the exact pattern needed (gold when positive, destructive when negative, arrow icon + sr-only gana/pierde) and it simply isn't reused here, on the one page whose entire job is delivering a verdict.
- Fix: reuse that verdict pattern.
- Suggested command: `/impeccable colorize`

**[P2] Inconsistent section chrome**
- Location: Materiales gets a card (`rounded-sm border border-border bg-card`); "Cómo sale el número" -- the section that answers the page's promise -- sits bare with no panel.
- Fix: wrap the derivation section in the same card treatment, ideally reusing `Panel` from `calculator/ui.tsx`.
- Suggested command: `/impeccable layout`

**[P3] Opening sentence overloads for a mobile scanner**
- Location: the summary paragraph packs cost/sell/profit/margin/silver-per-day/age into one sentence -- confirmed 8+ lines of prose at 375px before any stat list appears.
- Fix: trim to a single-clause verdict ("Rentable: +X plata/día"), let the `dl` carry the detail it already duplicates.
- Suggested command: `/impeccable distill`

## Persona Red Flags

**Casey (distracted mobile)**: a time-pressed mobile player mid-session hits the dense opening paragraph and has to actively read rather than glance -- exactly the persona this page exists for, worst served by it.

**Jordan (first-timer)**: unfamiliar with "liquidez"/quality-tier jargon gets no more scaffolding here than a veteran would; the FAQ answers "is it rentable," not "what does Q3 mean."

**Riley (stress-tester)**: verified the insufficient-data state is honest and the 404 state is clean and on-brand.

## Minor Observations

- The insufficient-data page still shows fully-priced materials even though the banner says "no hay precios suficientes" -- technically correct (materials priced, sell-side isn't) but reads as a mild contradiction; a one-line clarifying note would help.
- The cost/sell/profit numbers appear twice in a row (prose paragraph, then the `dl` immediately below) -- same numbers, two formats, no new information.
- Materials table markup verified correct (`<th scope="row">` for material name, not styled `<td>`s).

## Questions to Consider

1. If the ranking's entire pitch is "the gold number is the one that matters," why does the page built to deliver that number to a cold visitor not show it in gold?
2. Was this page assembled by composing strings/layout independently from `recipe-row.tsx` rather than extracting a shared "verdict" component -- and does that risk the same drift on future pages?
