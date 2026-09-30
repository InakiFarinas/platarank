---
target: flipping
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\flipping\\page.tsx"
target_fingerprint: "sha256:27417624b3569d0add942fbf8dd1ba9654044ad0ac0152b49288e7c82c0f9605"
target_path: "D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\flipping\\page.tsx"
timestamp: 2026-09-30T22-15-11Z
slug: src-app-locale-flipping-page-tsx
---
Method: dual-agent (A: a554e42c5d4cb5610 · B: a508d2081562b9766)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Recalculating spinner + aria-live + inline/full-page loading states all present |
| 2 | Match System / Real World | 1 | Top-ranked row is a same-city (Lymhurst -> Lymhurst) buy-order/sell-order spread, contradicting the page's own "buy cheap in one city, sell in another" copy and the arrow/Transport CTA |
| 3 | User Control and Freedom | 3 | Filter chips individually removable, "Restaurar por defecto", dismissible sheets |
| 4 | Consistency and Standards | 3 | Fully consistent with the rest of the site -- but that consistency came from cloning the crafting-row template wholesale rather than adapting it |
| 5 | Error Prevention | 2 | No bounds feedback on number fields; no warning that "Solo orden propia" implies an unknown wait |
| 6 | Recognition Rather Than Recall | 2 | The buy-method options' explanations live only in a native `title` (touch-inaccessible), on the one page's own newest and least obvious control |
| 7 | Flexibility and Efficiency | 3 | URL-state persistence, sortable columns, page-jump input, chip-based clearing |
| 8 | Aesthetic and Minimalist Design | 3 | Fits the guild-ledger dark/parchment/gold world cleanly; tabular-nums and city colors read fast |
| 9 | Error Recovery | 2 | Generic "recalcFailed" + retry with no specifics |
| 10 | Help and Documentation | 2 | SEO FAQ exists but doesn't cover how to choose among the three buy methods |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment (Assessment A)**: Largely a reskinned crafting-ranking row, not a composition authored for arbitrage's actual mechanic. `flip-row.tsx` is structurally a clone of `recipe-row.tsx` (identical `LedgerRow`/`ContractCard`/`useIsWide` shapes; a hydration comment at flip-row.tsx:34-35 is copy-pasted verbatim from recipe-row.tsx, an explicit tell). The one mechanic genuinely new to this page -- the buy-method choice -- was bolted onto the filters sidebar with the same generic `Segmented`/`NumberField`/`FilterCard` primitives as crafting's cost assumptions, with no treatment proportional to how much it changes the numbers shown. Live inspection surfaced the clearest evidence: the #1-ranked row is a same-city trade (Lymhurst -> Lymhurst), rendered with the same directional arrow and "Ver capacidad de carga" (Transport) CTA as a genuine cross-city row -- one template serving two conceptually different trades with nothing in copy, iconography, or filters to tell them apart.

**Deterministic scan (Assessment B)**: `impeccable detect --json` on `src/app/[locale]/flipping` and `src/components/flipping` returned `[]` -- zero findings, clean exit. This is expected: a static pattern detector cannot catch a semantic/product-coherence issue like "same-city rows are indistinguishable from cross-city ones." The detector's silence does not contradict Assessment A's verdict; it simply operates on a different plane (implementation patterns, not domain correctness).

**Visual overlays**: Not injected this run -- Assessment B used direct browser inspection (screenshots, `read_page`, DOM measurement) rather than the `impeccable live-server` + `detect.js` injection flow, so there is no on-page overlay visible in a `[Human]` tab. Fallback signal instead: Assessment B measured concrete touch targets via `getBoundingClientRect` (city-filter pills 26px tall, sheet close buttons 28px, both under the project's own stated 44px mobile-surface commitment in PRODUCT.md; the "Cómo comprás" segmented buttons and the filters FAB do meet it), confirmed zero horizontal overflow at 375px, and confirmed the dark/gold palette holds with no light-mode leakage in either sheet.

## Overall Impression

The page is legible, on-brand, and functionally solid -- numbers are scannable, filters persist in the URL, and nothing crashed or produced a console error in either assessment. But it was built by copying the crafting-ranking row rather than by asking what's structurally different about a flip, and that shows up as a real defect, not just a stylistic one: the #1 row a player sees is a same-city spread trade wearing cross-city arbitrage's clothing (arrow, "sell in another city" copy, a transport-capacity CTA). The single biggest opportunity is closing that gap -- distinguishing same-city order-book plays from real cross-city arbitrage in copy, iconography, and filtering -- because right now the page's flagship metric (plata/día) can rank #1 something its own intro paragraph says shouldn't exist.

## What's Working

- **Legible, scannable numerics**: `formatSilver`/`formatPercent` + `tabular-nums` + consistent right-alignment make the whole table fast to read at a glance -- well suited to checking one-handed next to the game.
- **City color-coding via `CITY_THEMES`**: once learned, lets a returning player recognize buy/sell cities by color without re-reading text.
- **URL-persisted state + removable filter chips**: a tuned filter combination survives reload/share, and each active filter is independently one-tap removable -- genuinely useful for a page a player revisits daily.

## Priority Issues

**[P0] Same-city "flips" are indistinguishable from cross-city arbitrage, and the Transport CTA misfires on them**
Why it matters: the page's own copy promises "comprá barato en una ciudad, vendé caro en otra"; a same-city top result (confirmed live: Lymhurst -> Lymhurst) contradicts that model at the exact moment (the #1 row) a player forms trust in the page, and tapping "Ver capacidad de carga" sends them to a transport calculator for a haul that doesn't exist.
Fix: when `buyCity === sellCity`, suppress the arrow/Transport CTA and label the row as a same-city spread trade; consider a filter to separate same-city plays from genuine cross-city ones, since the distinction is core to what "flipping" means to the audience.
Suggested command: `/impeccable clarify`

**[P1] The new buy-method control's explanations are touch-inaccessible**
Why it matters: `Segmented`'s three buy-method options carry their explanation only in a `title` attribute, even though the codebase's own comment on `Segmented.labelHint` (calculator/ui.tsx) says explicitly that `title` never opens on tap -- on a mobile-first product, the one genuinely new and least obvious decision on the page is explained through the one mechanism already known not to work on the primary device.
Fix: pass a `labelHint` (tap-to-reveal info), matching the pattern the codebase already uses elsewhere for exactly this reason.
Suggested command: `/impeccable clarify`

**[P1] Filters sidebar exceeds a sane number of simultaneous decisions**
Why it matters: ~6 buy-city toggles + the 3-way buy-method toggle + ~6 sell-city toggles + Black Market + market share + 3 list filters are all visible/reachable in one scroll; the buy-method toggle (the one novel control) is buried inside the "Ciudades" card, conflating a geography decision with an execution-strategy decision.
Fix: give buy-method its own `FilterCard`; default-collapse "Supuestos de cálculo" the way "Filtros de lista" already collapses.
Suggested command: `/impeccable layout`

**[P2] Touch targets below the product's own 44px mobile commitment**
Why it matters: measured city-filter pill buttons are 26px tall and sheet close buttons are 28px -- under both common guidance and PRODUCT.md's own explicit "touch targets of 44px on the mobile surfaces" commitment, on the platform PlataRank states is its primary reading context.
Fix: increase the pill buttons' vertical padding and the close buttons' hit area to reach 44px, without necessarily growing their visible size (padding vs. `after:` pseudo-hit-area, a pattern already used elsewhere in this codebase, e.g. `FlipControls`' own floating button).
Suggested command: `/impeccable adapt`

**[P2] "Insufficient data" gives no reason inline**
Why it matters: the badge dims the row and adds an aria suffix but never states what's missing until the detail sheet is opened -- a first-timer can't tell, without an extra tap, whether to trust an attractive-looking number.
Fix: surface the specific reason (stale side, thin volume) as the badge's own tooltip/inline text, reusing data `RowDetail` already computes.
Suggested command: `/impeccable clarify`

## Persona Red Flags

**Jordan (First-Timer)**: Reads the intro promising cross-city buy-low/sell-high, then the very first row shown contradicts it (Lymhurst -> Lymhurst). Opens "Cómo comprás" to understand the three options and, on a touch device, gets nothing (the `title` tooltip doesn't fire) -- left guessing whether "Solo orden propia" means the trade happens now or in six hours.

**Casey (Distracted Mobile User)**: Taps into the #1 row expecting to confirm the numbers, taps "Ver capacidad de carga" expecting hauling info, and lands on a Transport tab for a trade that needs no transport -- a dead end at exactly the moment she wanted a fast answer. Opening the filters sheet to nudge one number means scrolling past roughly eight stacked control groups first.

**Sam (Accessibility-Dependent)**: `aria-expanded`/`aria-controls`/a full-sentence row `aria-label` (including the "datos insuficientes" state) are implemented carefully -- a genuine strength, confirmed in both assessments. But the mobile `ContractCard`'s accessible name only announces name/tier/value, dropping the buy/sell price breakdown sighted users see directly on the closed card -- a screen-reader user must always open the detail sheet for information a sighted user gets at a glance. The buy-method radio options have no `aria-describedby` pointing at their explanation, so a screen reader announces "Automático, radio button" with zero context -- the same information gap Jordan and Casey hit.

## Minor Observations

- `flip-row.tsx`'s hydration comment (lines 34-35) is copy-pasted verbatim from `recipe-row.tsx` -- a direct signal the file was cloned rather than authored for this mechanic.
- Discard-reason copy (`discard_outlier_low/high/self`) is duplicated near-verbatim from crafting's equivalent strings, including "posible troll listing" -- jargon-adjacent language never defined anywhere on the page despite the product's stated no-jargon stance.
- Market-share hint copy ("Qué parte del volumen diario asumís poder capturar vos") doesn't clarify that flipping has two decoupled markets (buy-side city, sell-side city); doesn't say whether the % applies per leg or to the bottleneck.
- The visible mobile card content (full buy->sell price line) is richer than what's exposed to the accessible name -- a visible/announced content mismatch, confirmed by Assessment A.
- Assessment B confirmed zero console errors, zero horizontal overflow at 375px, and no light-mode color leakage in either sheet -- clean on all three counts.

## Questions to Consider

- If a same-city buy-order/sell-order spread can legitimately rank #1, is "cross-city arbitrage" the right name, copy, and arrow metaphor for this feature at all, or is it quietly two different plays wearing one costume?
- The buy-method toggle is the one mechanic invented specifically for this page -- why does it get the same visual weight as a city checkbox instead of a treatment proportional to how much it changes the numbers shown?
- What would change if "Ver capacidad de carga" were computed per-row from the actual city pair (hidden/relabeled for same-city rows) instead of a static link -- would that alone force the same-city-vs-cross-city distinction to finally show up in the design?
