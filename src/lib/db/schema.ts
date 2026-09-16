import { pgTable, text, integer, smallint, numeric, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";

export const recipes = pgTable("recipes", {
  itemId: text("item_id").primaryKey(),
  baseItemId: text("base_item_id").notNull(),
  nameEs: text("name_es").notNull(),
  nameEn: text("name_en").notNull(),
  tier: smallint("tier").notNull(),
  enchant: smallint("enchant").notNull(),
  stationType: text("station_type").notNull(),
  // Item's own craftingcategory from the dump (e.g. "potion", "wood", "sword", "plate_armor").
  // Null when the item has none (e.g. faction/artifact capes) -- those get no city-specialty
  // bonus, ever; see src/lib/city-specialties.ts.
  craftingCategory: text("crafting_category"),
  maxQualityLevel: smallint("max_quality_level").notNull().default(1),
  batchSize: smallint("batch_size").notNull(),
  craftingFocus: integer("crafting_focus").notNull(),
  materials: jsonb("materials").$type<RecipeMaterial[]>().notNull(),
  // Sum of every non-artifact material's real @itemvalue (from items.json), each multiplied by its
  // recipe count -- the static "IV" the game's own crafting-fee formula is built on. Resolved
  // recursively at build time in fetch-game-data.ts when a material has no stored @itemvalue of its
  // own (e.g. cocina's butter/alcohol/bread only carry a sub-recipe, not a value). See station-fee.ts.
  materialItemValue: numeric("material_item_value").notNull().default("0"),
});

export type Recipe = typeof recipes.$inferSelect;

export type RecipeMaterial = {
  itemId: string;
  count: number;
  category: "farm" | "extract" | "artifact" | "meat" | "fish" | "other";
  nameEs: string;
  nameEn: string;
};

// NOTE on raw retention: the brief originally called for persisting 30 days of raw price_quotes
// and volume_daily rows (see section 6). That held fine at alchemy/refining/cocina scale (~680
// items, quality 1 only). Once armas y armaduras added the quality dimension (~5,600 items x up
// to 5 qualities x 8 cities), a naive raw INSERT per ingest run would write ~236k price rows and
// ~7M volume rows PER HOURLY RUN -- Supabase's free tier fills in hours, not months. Nothing in
// the app ever queried these raw tables (only market_aggregates, which upserts and stays bounded
// at ~236k rows total, not per run), so they were dropped rather than kept empty as dead schema.
// AODP's own /stats/history endpoint already retains the same 30-day window if a raw recompute is
// ever needed. This is a deliberate, documented deviation from the original brief.

// Precomputed per-item-per-city-per-quality aggregates. All recipe math reads from here, never from the raw
// tables, so the recipes x cities x scenario combinatoria that Fase 2's city selectors introduce
// doesn't hit raw rows. Kept per-city (not collapsed cross-city like Fase 1) because Fase 2 needs
// to recompute the cross-city stat client-side against whatever subset of cities the user picked
// as "where I buy" / "where I sell" -- that reduction is cheap (<=8 rows per item) and reuses the
// same outlier-trimming formulas in the browser.
export const marketAggregates = pgTable(
  "market_aggregates",
  {
    itemId: text("item_id").notNull(),
    city: text("city").notNull(),
    quality: smallint("quality").notNull().default(1),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),

    // Black Market has no sell orders, so this holds buy_price_max there (what a seller actually
    // receives) and sell_price_min everywhere else (what a buyer actually pays).
    price: numeric("price"),
    priceAgeSeconds: integer("price_age_seconds"),

    avgDailyVolume30d: numeric("avg_daily_volume_30d").notNull().default("0"),
    daysWithVolume30d: smallint("days_with_volume_30d").notNull().default(0),
    weightedAvgPrice30d: numeric("weighted_avg_price_30d"),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.city, t.quality] })],
);

export type MarketAggregateRow = typeof marketAggregates.$inferSelect;

// One row, key "last_dump_url": the daily AODP dump the ingester last fully processed. The
// ingester runs hourly but the dump only refreshes once a day -- this lets it skip the ~260MB
// download and full re-parse when today's dump hasn't changed, updating only current prices
// (cheap REST calls) instead of also recomputing 30-day volume from a dump it already has.
export const ingestState = pgTable("ingest_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
