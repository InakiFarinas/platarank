---
target: legal/about/methodology pages
total_score: 15
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\metodologia\\page.tsx"
target_fingerprint: "sha256:2d1cd78a5c248405ca76dc828d927ddf4fead9c4faac3402a7d2faf1ad833b01"
target_path: "D:\\Proyectos\\AlbionData\\src\\app\\[locale]\\metodologia\\page.tsx"
timestamp: 2026-09-30T20-05-08Z
slug: src-app-locale-metodologia-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | "Actualizado" date present and correct |
| 2 | Match Between System and Real World | 3 | Correct Albion jargon, appropriate for the informed reader |
| 3 | User Control and Freedom | 1 | No anchors/TOC/back-to-top across 11 sections |
| 4 | Consistency and Standards | 2 | Consistent across the 4 pages, inconsistent with the rest of the app's visual system |
| 5 | Error Prevention | n/a | No inputs/actions on a static read page |
| 6 | Recognition Rather Than Recall | 1 | Formulas sit inline in prose with zero visual distinction (no mono/code treatment) |
| 7 | Flexibility and Efficiency of Use | 1 | No jump links to a specific section, no search |
| 8 | Aesthetic and Minimalist Design | 2 | Clean but generic -- doesn't earn "worth reading" |
| 9 | Error Recovery | n/a | Not applicable to static content |
| 10 | Help and Documentation | 2 | Content is thorough and honest, but poorly sequenced as documentation |
| **Total** | | **15/32 (2 n/a) (47%) -- Poor** | |

## Design Specificity Verdict

Generic. Metodología -- the product's core trust document, PRODUCT.md's own "entire pitch" -- gets the exact same undifferentiated `h2`/`p`/`ul` treatment as Términos (a boilerplate ToS). None of the app's signature visual grammar (Cinzel, double-ruled hairlines, wax seal, rule-fleur) enters the content body; it stops at the shared header/footer chrome. Deterministic scan: CLI clean (0 findings) on all 4 pages + their content files and `legal-page.tsx`. Line-length measured live: ~103 characters/line on Metodología's body text at desktop width, above the ~80-char target.

## Overall Impression

Content is genuinely rigorous and honest, but the page recites rather than asserts. A reader has to linearly consume ~1,400 words before reaching "Limitaciones conocidas" -- the section that most directly answers "can I trust this" -- because it's last, not first.

## What's Working

- Real `<h2>` semantic elements (verified: H1 -> H2 x12 on Metodología, no skipped levels) mean screen-reader users can jump section-to-section via the heading rotor even without a visual TOC.
- The "Limitaciones conocidas" section matches PRODUCT.md's "silence is worse than an ugly caveat" principle in substance -- it's just buried.
- Privacidad and Términos are appropriately short and don't suffer the wall-of-text problem -- the critique below is specific to Metodología's length and role.
- Verified live, no horizontal overflow at 375px or 1440px on any of the 4 pages, no console errors.

## Priority Issues

**[P1] No in-page navigation for an 11-section technical document**
- Location: `src/app/[locale]/metodologia/content/es.tsx` (all 11 `<h2>`s).
- Why it matters: a reader trying to verify one formula has no anchor list and must scroll past everything else.
- Fix: add a short anchor-linked section index under the page title, reusing the existing `[&_a]:text-money` link styling.
- Suggested command: `/impeccable layout`

**[P1] Formulas have no visual distinction from prose**
- Location: e.g. the return-rate and fee formulas, all inline text in `<p>` tags.
- Why it matters: the app already has a dedicated mono type role reserved for numeric values (DESIGN.md) and it's never applied here.
- Fix: wrap each formula in a `<code>`/`<pre>` styled with the existing mono token.
- Suggested command: `/impeccable typeset`

**[P1] The trust payoff is buried last**
- Location: "Limitaciones conocidas," the final of 11 sections.
- Why it matters: it's the section most aligned with the product's honesty principle, and a skeptical reader who bounces after 2-3 sections never sees it.
- Fix: surface a 1-2 line summary/callout near the top, or move the section earlier.
- Suggested command: `/impeccable layout`

**[P2] Weak heading contrast for scanning**
- Location: `legal-page.tsx` -- `[&_h2]:text-base [&_h2]:font-heading` against `text-sm` body is only a small step, insufficient for a document meant to be scanned.
- Fix: bump h2 weight/size, or add a reduced-scale hairline above each section.
- Suggested command: `/impeccable typeset`

**[P3] Long undifferentiated paragraphs hide discrete facts**
- Location: "Escondites," "Diarios de trabajador," "Monturas criadas" each bundle a formula, exceptions, and caveats into one prose block.
- Fix: a bulleted breakdown (formula / exclusions / caveat) would scan faster.
- Suggested command: `/impeccable layout`

## Persona Red Flags

**Jordan (first-timer, skeptical)**: comes to Metodología specifically to decide whether to trust the ranking, hits a cold technical wall with no framing, and may bounce before reaching the limitations section that would have won them over.

**Sam (accessibility)**: low heading/body contrast makes sighted low-vision skimming harder even though screen-reader heading navigation works fine -- backwards for a mixed-audience document this dense.

## Minor Observations

- `legal-page.tsx` applies `text-money` to every link in every legal page, including plain cross-reference links -- stretches the One Coin Rule's narrow exception list.
- Metodología opens cold on "Fuentes de datos" with zero framing sentence, unlike Acerca which opens with a plain-language mission statement.

## Questions to Consider

1. If Metodología is "the product's entire pitch," why does it get zero of the visual investment (Cinzel, double rules, wax seal) the home page's "Guild Ceremony" pass got?
2. Would moving "Limitaciones conocidas" to the top convert more skeptical first-time readers than any amount of formula precision further down the page?
