---
target: Row + Expandable Detail (recipe-row.tsx)
total_score: 23
max_score: 36
na_heuristics: 10
p0_count: 2
p1_count: 1
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\components\\recipes\\recipe-row.tsx"
target_fingerprint: "sha256:24725306bd17e7ce88f642a049ce980c25521f2e6add8265155a126c1a6f9d12"
target_path: "D:\\Proyectos\\AlbionData\\src\\components\\recipes\\recipe-row.tsx"
timestamp: 2026-09-18T02-45-03Z
slug: src-components-recipes-recipe-row-tsx
---
Method: dual-agent (A: a3dfd8df3e325a23b · B: acf5ef98106966f3e)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | `aria-expanded`/chevron work, but data age only surfaces after opening a row — no staleness signal while scanning |
| 2 | Match System / Real World | 4 | Domain vocabulary ("plata/día", "lote", "cuota de mercado") is correct throughout |
| 3 | User Control and Freedom | 1 | Confirmed live: Enter/Space do not expand a row at all — keyboard users are completely locked out of the app's core interaction |
| 4 | Consistency and Standards | 3 | Desktop row and mobile Pergamino Sheet reuse the same derivation content, reordered sensibly |
| 5 | Error Prevention | 3 | `sin dato`/`--` fallbacks prevent fabricated numbers, per the stated product principle |
| 6 | Recognition Rather Than Recall | 2 | Expanded panel never restates rank/margen/plata-día, forcing memory round-trips while reading the derivation |
| 7 | Flexibility and Efficiency | 2 | No bulk-expand or shortcut; low priority for this surface but not fully n/a |
| 8 | Aesthetic and Minimalist Design | 3 | Dense by design, appropriately so; derivation is organized into two clear sections |
| 9 | Error Recovery | 2 | "Datos insuficientes" gives no next step or reason |
| 10 | Help and Documentation | n/a | Not applicable to a data-verification component |
| **Total** | | **23/36** | **Acceptable (64%)** |

## Design Specificity Verdict

**LLM assessment**: This is not a generic expandable row — it's built for the verification task at hand. The Venta/Materiales split mirrors how a player would manually sanity-check a number, `DISCARD_REASON_LABEL` turns raw outlier codes into plain language ("posible bait", "posible troll listing"), and the mobile card's restrained scroll-icon tap target (not a big button) keeps density intact. This reads as authored for this product.

**Deterministic scan**: CLI detector found 0 issues on the three target files (exit 0). A live overlay on the rendered `/equipo` page found 35 anti-patterns, but page-wide (header, badges, icons included) — not attributable to these three files specifically; treat as page context, not a defect count for this target.

**Visual overlays**: Injection ran live this session; findings above came from that console output.

## Overall Impression

The derivation panel itself is genuinely well-designed — it's the one part of this app that visibly earns the product's "show your work" pitch. But the row is the single most-used interaction in the entire tool, and keyboard activation is completely broken: a real `<button>` with `aria-expanded` that simply does not respond to Enter or Space, confirmed by testing twice. That one confirmed defect outweighs everything else found here.

## What's Working

- **The illiquid-price dashed-underline convention** (`decoration-dashed decoration-muted-foreground`) is correctly implemented in source for the standard case — a genuine grayscale-safe signal, not color-alone.
- **`DISCARD_REASON_LABEL`** turning raw outlier codes into readable explanations is a real trust-building detail most tools skip.
- **Mobile's Pergamino Sheet** reuses the exact same derivation content as desktop rather than a stripped-down copy — confirmed via screenshot.

## Priority Issues

**[P0] Keyboard users cannot open any row — confirmed broken, not a false positive.** Assessment B tested Enter and Space on a focused row button twice; `aria-expanded` never changed and nothing visually expanded, despite the element being a native `<button>`. This blocks the app's single core interaction for keyboard-only and switch-device users entirely. Fix: find what's intercepting/preventing default button activation (likely a manual pointer-only handler) and restore native keyboard semantics. → `/impeccable audit`

**[P0] The row button has no accessible name.** The accessibility tree shows an unnamed button; a screen reader gets the row's raw concatenated text ("Poción de veneno mayorT8.133.2kcosto8.0Mprecio venta...") instead of a clean announcement. Combined with the P0 above, this component is currently unusable for a screen-reader user even if keyboard activation gets fixed. Fix: add a descriptive `aria-label` (e.g. "Poción de veneno mayor, T8.1, 1377.4M plata por día, expandir detalle"). → `/impeccable harden`

**[P1] Illiquid gear-quality line doesn't match its documented styling in the live render.** Assessment A confirmed the dashed-underline+opacity treatment in source for illiquid priced qualities, but Assessment B's live screenshot of an excluded Q5 line on `/equipo` showed plain inline text ("Q5 Obra maestra: 4.0k plata -- sin liquidez, no cuenta") at the same visual weight as every other line — no dimming, no dashed underline. Worth reconciling which code path actually renders in production before trusting the Line-Not-Hue Rule is holding here. → `/impeccable audit`

**[P2] No staleness signal on the collapsed row.** Data age only appears after opening a row; a player scanning 174 rows can't tell fresh from 22h-old data without opening each one, despite PRODUCT.md's own principle that missing/stale data must never be smoothed over. Fix: a subtle age indicator in the collapsed row past a threshold. → `/impeccable clarify`

**[P3] Expanded panel never restates the row's headline numbers.** No recap of rank/margen/plata-día inside `RowDetail`, forcing a memory round-trip against the collapsed row above it. Fix: a slim sticky recap line at the top of the derivation. → `/impeccable layout`

## Persona Red Flags

**Sam (accessibility-dependent)**: Cannot open a single row's derivation via keyboard — the product's entire pitch ("trust the derivation") is completely inaccessible to this persona right now, independent of the missing accessible name.
**Riley (stress tester)**: Immediately pokes at the T8.1 outlier row (+22513% margin) — math holds internally, but nothing proactively flags it as worth double-checking, and it's exactly the kind of number that erodes trust if it turns out wrong.
**Jordan (first-timer)**: Sees a huge unexplained percentage at rank 1 with no cue that tapping the row explains it, beyond a generic chevron.

## Minor Observations

- `specialtyLabel` copy ("con especialidad… sin foco") is grammatically dense; could split into two shorter clauses.
- Desktop hides Costo/Precio venta/Ciudad bono below `xl:` (1280px) — a lot of hidden columns on a merely-large, not ultra-wide, screen.

## Questions to Consider

- Given the keyboard-activation break, is this a recent regression (e.g. from a pointer-event refactor) or has the row never been keyboard-accessible?
- Should the collapsed row surface data age as a first-class signal, given "never show a number without knowing it might be stale" is the stated product principle?
- Is the outlier-magnitude row (+22513%) legitimate enough to deserve its own "verify this" nudge, given trust-building is the whole point of this component?
