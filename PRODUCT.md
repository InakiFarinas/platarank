# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router) + TypeScript, Tailwind + shadcn/ui, TanStack Table + TanStack Virtual, Supabase/Postgres + Drizzle ORM, deployed on Vercel. Decided by the user before this file existed, not delegated.

## Users

Albion Online players who craft (alchemy potions, and now refined materials) to sell for silver, checking the tool from a phone next to the game (mobile is the primary reading context) or from a desktop browser while planning a crafting session. They already know the game's mechanics; they don't need those explained, they need trustworthy numbers.

## Product Purpose

Ranks crafting recipes -- alchemy potions and, as of Fase 3, refined materials (planks/cloth/metal bars/leather/stone blocks) -- by **realizable silver per day** (unit margin x daily market volume x the player's assumed market share) instead of unit margin alone, because a high-ROI recipe that the market barely absorbs is worth less than a lower-ROI recipe with real daily volume. Success is a player trusting the ranking enough to act on it without re-deriving the math themselves.

## Positioning

Three things a generic price/margin calculator cannot truthfully claim: (1) volume is inside the ranking math, not a decorative column; (2) every row shows its full derivation (price used, city, data age, what was discarded and why) so a wrong number is visibly wrong instead of silently wrong; (3) exact per-station-type usage-fee formulas (silver per 100 nutrition, not a flat %) instead of an approximated flat crafting tax.

## Operating Context

Data comes from the free public Albion Online Data Project API (community-donated, rate-limited, attribution required) plus the official game client data dump for recipes. A GitHub Actions cron ingests and precomputes aggregates hourly; the app reads only precomputed data, never raw quotes, to keep recipe-math latency sane. Single server (Americas) so far; no accounts, no login, no payments.

## Capabilities and Constraints

- Fase 3 is live: a second surface, Refinado (`/refinado`), alongside Alquimia (`/alquimia`) -- 115 refining recipes (wood/fiber/ore/hide/rock -> planks/cloth/metal bars/leather/stone blocks, tiers 2-8, enchant 0-4) on top of the 174 alchemy ones, 449 priced items total. Both surfaces share one server component (`recipe-page.tsx`) and the same table/explorer/controls, branching only on `stationType` where the mechanics actually differ (refining's tier/enchant-only fee formula vs. alchemy's farm-material one; a "especialidad de refinado" toggle instead of alchemy's fixed Brecilien assumption).
- Fase 2 controls are live and generic across station types: separate buy-city and sell-city selectors (Black Market is an explicit opt-in toggle under sell, not just another city), an editable market-share %, a focus on/off switch, an editable station fee rate, and max-age / min-volume filters. All of it is client-side session state (no accounts) held in a Sheet-based Filtros panel; nothing persists across reloads yet.
- Recipe math runs on the client on purpose: the server ships precomputed per-item-per-city aggregates (`market_aggregates`, one row per item+city), and the browser reduces that small set (<=8 cities per item) against whatever cities/params the user picked, reusing the same outlier-trimming and quality-score formulas that used to run only at ingest time.
- Every ranked row must expose: the silver-per-day figure, a visible data-quality score (0-100), and an expandable derivation (price source + city + age, materials + costs, station fee, return rate, market share, and every discarded outlier with its reason).
- Black Market is a structurally different venue (buy orders only, quality >= requested) and must never be presented as just another city column.
- Data can be missing or stale per city (Brecilien especially); the UI must say so explicitly rather than hide it or fabricate a number.
- No golden-case captures exist yet to verify fee/return-rate formulas against the live game -- this is an open, tracked gap, not a silent assumption.
- Weapons, armor, tools and cocina are NOT built yet (rest of Fase 3's original scope) -- those need a quality dimension (5 levels) that refining and alchemy don't have, and per-item-type crafting-specialty cities that haven't been verified.

## Brand Commitments

Name: PlataRank (repo/package `platarank`). No existing visual identity, logo, or asset library yet -- this is the first surface.

## Evidence on Hand

Real market data is live: the ingester has run successfully against AODP Americas and populated `market_aggregates` for all 449 priced items (alchemy + refining). Recipe data (289 recipes: 174 alchemy + 115 refining) is real, pulled from the official ao-bin-dumps client data. The ingester now runs hourly via GitHub Actions.

## Product Principles

- The ranking metric is silver/day, always -- never let a UI element imply unit margin is the primary signal.
- Never show a number without a way to see where it came from; "trust the derivation" is the product's entire pitch.
- Silence is worse than an ugly caveat: missing/thin data gets flagged in the row, never smoothed over.
- Mobile is not an afterthought breakpoint -- it's the primary reading context, checked one-handed next to the game.
- Simple over clever: every assumption (market share, station rate, focus, which cities count) is a visible, adjustable control, never a hidden default the user has to reverse-engineer.

## Accessibility & Inclusion

No specific requirement established yet beyond the mobile-first operating context above.
