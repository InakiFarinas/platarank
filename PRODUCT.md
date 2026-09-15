# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router) + TypeScript, Tailwind + shadcn/ui, TanStack Table + TanStack Virtual, Supabase/Postgres + Drizzle ORM, deployed on Vercel. Decided by the user before this file existed, not delegated.

## Users

Albion Online players who craft (alchemy potions, and now refined materials) to sell for silver, checking the tool from a phone next to the game (mobile is the primary reading context) or from a desktop browser while planning a crafting session. They already know the game's mechanics; they don't need those explained, they need trustworthy numbers.

## Product Purpose

Ranks crafting recipes -- alchemy potions, refined materials, cocina meals, and now armas y armaduras -- by **realizable silver per day** (unit margin x daily market volume x the player's assumed market share) instead of unit margin alone, because a high-ROI recipe that the market barely absorbs is worth less than a lower-ROI recipe with real daily volume. Success is a player trusting the ranking enough to act on it without re-deriving the math themselves.

## Positioning

Three things a generic price/margin calculator cannot truthfully claim: (1) volume is inside the ranking math, not a decorative column; (2) every row shows its full derivation (price used, city, data age, what was discarded and why) so a wrong number is visibly wrong instead of silently wrong; (3) exact per-station-type usage-fee formulas (silver per 100 nutrition, not a flat %) instead of an approximated flat crafting tax.

## Operating Context

Data comes from the free public Albion Online Data Project API (community-donated, rate-limited, attribution required) plus the official game client data dump: items.json for recipes, craftingmodifiers.xml for city specialties, gamedata.xml for the crafting-quality distribution -- all three parsed at build time (fast-xml-parser), never transcribed by hand. A GitHub Actions cron ingests and precomputes aggregates hourly; the app reads only precomputed data, never raw quotes, to keep recipe-math latency sane. Single server (Americas) so far; no accounts, no login, no payments.

## Capabilities and Constraints

- Fase 3 is live for all four station types: Alquimia (`/alquimia`, 174 recipes), Refinado (`/refinado`, 115 recipes), Cocina (`/cocina`, 183 recipes), and Equipo/armas y armaduras (`/equipo`, ~5,600 recipes: standard gear across every weapon and armor line, including faction/hellgate lines whose rare-drop artifact materials just show "datos insuficientes" when unpriced -- same honest-gap behavior as everything else, not a special case).
- City-specialty resolution is fully generic now: every recipe carries its own `craftingCategory` from the dump (potion, wood, sword, plate_armor, ...), and a single parsed lookup (`src/lib/city-specialties.ts`, sourced from craftingmodifiers.xml) maps each category to the one city with that bonus and its kind (crafting +15% or refining +40%). One global "ciudad donde craftea" selector replaces what used to be alchemy's hardcoded Brecilien plus separate per-rubro toggles for refinado/cocina -- the same control now drives all four station types, including gear's per-weapon/armor-type specialty cities, correctly.
- Gear adds a real quality dimension (Q1-Q5) that nothing else in the app has: `market_aggregates` carries qualities 1-5 for gear items (still just 1 for everything else), the expected sale price blends all five by a player-editable weight distribution (default: the game's own base CraftingQualityChances, 68.9/25/5/1/0.1%, since the real function that shifts these with focus/food/Destiny Board isn't published anywhere readable), and each quality is gated by its OWN `avgDailyVolume30d > 0` -- a quality with zero real trades contributes zero revenue no matter how tempting its parked listing price looks (brief section 7.4's core finding). The row detail shows the full per-quality breakdown, including the ones excluded for illiquidity.
- The crafteo-normal fee formula's artifact-tier term is fixed at 0 for every recipe (documented assumption): standard gear's direct craft never consumes a rúnico/alma/reliquia/avaloniano material (that only happens via the separate upgrade path we don't model), and the faction/hellgate lines that DO consume one have no derivable tier from the dump alone.
- Fase 2 controls are live and generic across station types: separate buy-city and sell-city selectors (Black Market is an explicit opt-in toggle under sell, not just another city), an editable market-share %, a focus on/off switch, an editable station fee rate, and max-age / min-volume filters. All of it is client-side session state (no accounts) held in a Sheet-based Filtros panel; nothing persists across reloads yet.
- Recipe math runs on the client on purpose: the server ships precomputed per-item-per-city(-per-quality) aggregates (`market_aggregates`), and the browser reduces that small set against whatever cities/params/quality-weights the user picked, reusing the same outlier-trimming and quality-score formulas that used to run only at ingest time.
- Raw price/volume history is NOT persisted to the DB (a deliberate deviation from the original brief's 30-day-raw-retention ask): once gear's quality dimension entered the picture, a naive raw INSERT per hourly run would have written ~236k price rows and ~7M volume rows PER RUN, filling Supabase's free tier in hours. Nothing ever queried those raw tables (only the upserted, storage-bounded `market_aggregates`), so they were dropped rather than kept as unused schema; AODP's own history endpoint retains the same 30-day window if a raw recompute is ever needed. See the note in `src/lib/db/schema.ts`.
- Every ranked row must expose: the silver-per-day figure, a visible data-quality score (0-100), and an expandable derivation (price source + city + age, materials + costs, station fee, return rate, market share, and every discarded outlier with its reason).
- Black Market is a structurally different venue (buy orders only, quality >= requested) and must never be presented as just another city column.
- Data can be missing or stale per city (Brecilien especially); the UI must say so explicitly rather than hide it or fabricate a number.
- No golden-case captures exist yet to verify fee/return-rate formulas against the live game -- this is an open, tracked gap, not a silent assumption.
- The ingester still runs everything hourly with a single priority level, even though the brief explicitly called for a priority queue once the catalog grew ("los ítems muertos se pueden refrescar una vez por día" -- section 6/9). At ~7,030 items (up from Fase 1's ~220) a single run now takes multiple minutes; it works, but it's not yet respecting the low-volume-items-refresh-less-often guidance. Open gap, not solved by this pass.
- `/equipo` is noticeably slow on first load (client-side `computeRecipeRow` over 5,632 rows, each blending 5 qualities across up to 8 cities, runs fresh in every visitor's browser on hydration -- SSG only speeds up the server-rendered HTML, not the client recompute). Measured 10-20+ seconds to first paint of rows in this session's testing. This needs a real fix (move the computation server-side and ship pre-reduced rows, or paginate/virtualize before computing) before this surface is genuinely usable on a phone -- flagged, not solved, in this pass.

## Brand Commitments

Name: PlataRank (repo/package `platarank`). No existing visual identity, logo, or asset library yet -- this is the first surface.

## Evidence on Hand

Real market data is live: the ingester has run successfully against AODP Americas and populated `market_aggregates` for all 678 priced items (alchemy + refining + cocina). Recipe data (472 recipes: 174 alchemy + 115 refining + 183 cocina) is real, pulled from the official ao-bin-dumps client data. The ingester now runs hourly via GitHub Actions.

## Product Principles

- The ranking metric is silver/day, always -- never let a UI element imply unit margin is the primary signal.
- Never show a number without a way to see where it came from; "trust the derivation" is the product's entire pitch.
- Silence is worse than an ugly caveat: missing/thin data gets flagged in the row, never smoothed over.
- Mobile is not an afterthought breakpoint -- it's the primary reading context, checked one-handed next to the game.
- Simple over clever: every assumption (market share, station rate, focus, which cities count) is a visible, adjustable control, never a hidden default the user has to reverse-engineer.

## Accessibility & Inclusion

No specific requirement established yet beyond the mobile-first operating context above.
