---
target: shared chrome (header/footer/nav)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:D:\\Proyectos\\AlbionData\\src\\components\\site-header.tsx"
target_fingerprint: "sha256:0bb22d3aeaa6bf9af139f1b6d30ff4e1c5052564647abd2f5d275394edace8ba"
target_path: "D:\\Proyectos\\AlbionData\\src\\components\\site-header.tsx"
timestamp: 2026-09-30T20-04-42Z
slug: src-components-site-header-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | aria-current, underline active state, sticky header all clear |
| 2 | Match Between System and Real World | 3 | Faction colors/wax seal/Discord mark authentic; "Crafteo" label mismatch |
| 3 | User Control and Freedom | 3 | Language switch, nav always reachable, no traps |
| 4 | Consistency and Standards | 2 | CraftMenu popup uses `shadow-md`, violating DESIGN.md's own No-Shadow Rule |
| 5 | Error Prevention | 3 | Little to break; sign-in is a simple redirect |
| 6 | Recognition Rather Than Recall | 2 | 6 items hidden in a text-only dropdown with no icons |
| 7 | Flexibility and Efficiency of Use | 2 | Full nav tabs only render at `xl:` (1280px+) |
| 8 | Aesthetic and Minimalist Design | 2 | Ledger motifs stop at the popover boundary |
| 9 | Error Recovery | 3 | Nothing egregious |
| 10 | Help and Documentation | 3 | Metodología/Acerca in footer |
| **Total** | | **26/40 (65%) -- Good** | |

## Design Specificity Verdict

Split personality. The identity layer (wax seal, Cinzel wordmark, faction city glyphs, custom Discord SVG mark) is genuinely authored. But the interaction layer -- the "Crafteo" dropdown and the Server `Select` -- falls back to plain shadcn chrome, and the dropdown directly contradicts the documented design system. Confirmed by grep: `site-header.tsx`'s `MenuPrimitive.Popup` carries `shadow-md` while `ui/select.tsx` has zero shadow classes -- the No-Shadow exception was engineered once for Select and never reused for CraftMenu. Deterministic scan: CLI clean on all 4 chrome files.

## Overall Impression

On the home page and page titles, the chrome feels premium and specific. But the moment a visitor interacts with the header (opens "Crafteo," opens the region selector) the voice reverts to generic dropdown chrome with a stray shadow the rest of the system explicitly forbids. Trust is asserted visually at rest and quietly withdrawn in motion.

## What's Working

- The Discord auth button uses a real hand-drawn mark and localized "Entrar con Discord" copy, not a generic "Sign in."
- `CityGlyph` crops a banner sprite to its emblem rather than squashing a rectangle into a badge -- real craft invisible to a casual glance but felt as quality.
- The language switch (verified live across ES/EN/PT, no raw i18n keys leaked) resists flag icons, which would misrepresent Spanish/Portuguese as country-bound -- a restrained, correct call.

## Priority Issues

**[P1] CraftMenu popup violates the No-Shadow Rule**
- Location: `site-header.tsx:286` -- `MenuPrimitive.Popup className="... shadow-md ..."`.
- Why it matters: DESIGN.md explicitly calls out that Select/Sheet popups ship with the shadow stripped; this is the one dropdown that got missed.
- Fix: drop `shadow-md`, rely on the existing border + surface step like `ui/select.tsx` does.
- Suggested command: `/impeccable polish`

**[P1] Full nav is hidden below 1280px**
- Location: `site-header.tsx:114` -- nav tabs only render at `xl:`.
- Why it matters: a 1024-1279px viewport (iPad landscape, many laptops) gets the full mobile hamburger treatment despite being a "desktop" screen -- not a niche size.
- Fix: lower the breakpoint to `lg:`, or make CraftMenu collapse more compactly there.
- Suggested command: `/impeccable adapt`

**[P2] Artefactos grouped under "Crafteo" despite being structurally different**
- Location: `site-header.tsx:20-27`, `271-308`. The Foundry has no silver/day ranking, no derivation panel -- a different mental model from the 5 ranked rubros it's filed alongside.
- Fix: give Artefactos its own top-level nav slot, or add a distinguishing subtitle/icon inside the dropdown.
- Suggested command: `/impeccable clarify`

**[P2] Wordmark text disappears on mobile**
- Location: `site-header.tsx:111,168` -- "PlataRank" text is `hidden ... sm:inline`, leaving only the icon below 640px, despite mobile being the stated primary reading context.
- Fix: keep an abbreviated wordmark or a smaller text lockup at mobile widths.
- Suggested command: `/impeccable adapt`

**[P3] Signed-in mobile user has no accessible name**
- Location: `auth-button.tsx` -- avatar has `alt=""`, name hidden until `md:`. A phone-width screen-reader user gets no indication of which account is signed in.
- Fix: put the name in an `sr-only` span at all widths.
- Suggested command: `/impeccable harden`

## Persona Red Flags

**Jordan (first-timer, mobile)**: opens the hamburger, sees "Crafteo" then Artefactos at the same visual weight as Alquimia/Refinado -- reasonably assumes it's another ranking, gets confused when it isn't.

**Alex (power user, 1024-1279px laptop)**: gets a phone-grade hamburger nav on what is functionally a desktop session.

**Sam (accessibility)**: signed-in mobile screen-reader user can tell they're logged in but not as whom.

## Minor Observations

- `ServerBadge` is fully generic shadcn `Select` chrome sitting right next to the faction-colored city concept -- a missed opportunity to extend the ledger vocabulary.
- `site-footer.tsx` carries only legal + Discord/Ko-fi links, no rubro links, despite the app's heavy SEO/AEO investment elsewhere.
- `ChevronDown` in CraftMenu doesn't rotate on open the way the signature row-expand chevron does elsewhere.
- Live verification: desktop dropdown closes correctly on Escape; mobile Sheet correctly includes the Discord sign-in button (fixed earlier this session) plus all 6 rubro links with counts.

## Questions to Consider

1. If Artefactos is architecturally nothing like the 5 ranked rubros, why is the only place it appears named "Crafteo"?
2. The ledger motif is rigorously confined to chrome-at-rest -- why does it stop exactly at the two places a user actively makes a choice (Crafteo dropdown, region Select)?
