# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router) + TypeScript, Tailwind + shadcn/ui, TanStack Table + TanStack Virtual, Supabase/Postgres + Drizzle ORM, deployed on Vercel. Decided by the user before this file existed, not delegated.

## Users

Albion Online players who craft alchemy potions to sell for silver, checking the tool from a phone next to the game (mobile is the primary reading context) or from a desktop browser while planning a crafting session. They already know the game's mechanics; they don't need those explained, they need trustworthy numbers.

## Product Purpose

Ranks alchemy crafting recipes by **realizable silver per day** (unit margin x daily market volume x the player's assumed market share) instead of unit margin alone, because a high-ROI recipe that the market barely absorbs is worth less than a lower-ROI recipe with real daily volume. Success is a player trusting the ranking enough to act on it without re-deriving the math themselves.

## Positioning

Three things a generic price/margin calculator cannot truthfully claim: (1) volume is inside the ranking math, not a decorative column; (2) every row shows its full derivation (price used, city, data age, what was discarded and why) so a wrong number is visibly wrong instead of silently wrong; (3) exact per-station-type usage-fee formulas (silver per 100 nutrition, not a flat %) instead of an approximated flat crafting tax.

## Operating Context

Data comes from the free public Albion Online Data Project API (community-donated, rate-limited, attribution required) plus the official game client data dump for recipes. A GitHub Actions cron ingests and precomputes aggregates hourly; the app reads only precomputed data, never raw quotes, to keep recipe-math latency sane. Fase 1 covers only alchemy (~220 items) on a single server (Americas); no accounts, no login, no payments.

## Capabilities and Constraints

- Fase 1 scope: one view, alchemy only, fixed 100% market-share assumption, buying at the cheapest available city (no per-city purchase restriction yet -- that's Fase 2).
- Every ranked row must expose: the silver-per-day figure, a visible data-quality score (0-100), and an expandable derivation (price source + city + age, materials + costs, station fee, return rate, and every discarded outlier with its reason).
- Black Market is a structurally different venue (buy orders only, quality >= requested) and must never be presented as just another city column.
- Data can be missing or stale per city (Brecilien especially); the UI must say so explicitly rather than hide it or fabricate a number.
- No golden-case captures exist yet to verify fee/return-rate formulas against the live game -- this is an open, tracked gap, not a silent assumption.

## Brand Commitments

Name: PlataRank (repo/package `platarank`). No existing visual identity, logo, or asset library yet -- this is the first surface.

## Evidence on Hand

No real market data is live in the UI yet (ingester and DB schema exist; first ingest run pending a DB credential from the user). Recipe data (174 alchemy recipes, ~220 priced items) is real, pulled from the official ao-bin-dumps client data.

## Product Principles

- The ranking metric is silver/day, always -- never let a UI element imply unit margin is the primary signal.
- Never show a number without a way to see where it came from; "trust the derivation" is the product's entire pitch.
- Silence is worse than an ugly caveat: missing/thin data gets flagged in the row, never smoothed over.
- Mobile is not an afterthought breakpoint -- it's the primary reading context, checked one-handed next to the game.
- Simple over clever: Fase 1 assumptions (fixed market share, cheapest-city buying) are explicit and temporary, not hidden defaults.

## Accessibility & Inclusion

No specific requirement established yet beyond the mobile-first operating context above.
