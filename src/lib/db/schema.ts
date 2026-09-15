import {
  pgTable,
  text,
  integer,
  smallint,
  numeric,
  timestamp,
  jsonb,
  boolean,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const recipes = pgTable("recipes", {
  itemId: text("item_id").primaryKey(),
  baseItemId: text("base_item_id").notNull(),
  nameEs: text("name_es").notNull(),
  nameEn: text("name_en").notNull(),
  tier: smallint("tier").notNull(),
  enchant: smallint("enchant").notNull(),
  stationType: text("station_type").notNull(),
  batchSize: smallint("batch_size").notNull(),
  craftingFocus: integer("crafting_focus").notNull(),
  materials: jsonb("materials").$type<RecipeMaterial[]>().notNull(),
});

export type Recipe = typeof recipes.$inferSelect;

export type RecipeMaterial = {
  itemId: string;
  count: number;
  category: "farm" | "extract" | "artifact" | "other";
  nameEs: string;
  nameEn: string;
};

// Raw price snapshots as returned by /stats/prices, one row per item+city+quality.
// Retention: rows older than 30 days are purged by the ingester.
export const priceQuotes = pgTable(
  "price_quotes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    itemId: text("item_id").notNull(),
    city: text("city").notNull(),
    quality: smallint("quality").notNull().default(1),
    sellPriceMin: numeric("sell_price_min"),
    sellPriceMinDate: timestamp("sell_price_min_date", { withTimezone: true }),
    sellPriceMax: numeric("sell_price_max"),
    sellPriceMaxDate: timestamp("sell_price_max_date", { withTimezone: true }),
    buyPriceMin: numeric("buy_price_min"),
    buyPriceMinDate: timestamp("buy_price_min_date", { withTimezone: true }),
    buyPriceMax: numeric("buy_price_max"),
    buyPriceMaxDate: timestamp("buy_price_max_date", { withTimezone: true }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("price_quotes_item_city_idx").on(t.itemId, t.city, t.fetchedAt)],
);

// Raw daily volume as returned by /stats/history (time-scale=24), one row per item+city+day.
// Retention: rows older than 30 days are purged by the ingester.
export const volumeDaily = pgTable(
  "volume_daily",
  {
    itemId: text("item_id").notNull(),
    city: text("city").notNull(),
    quality: smallint("quality").notNull().default(1),
    date: timestamp("date", { withTimezone: true }).notNull(),
    itemCount: integer("item_count").notNull(),
    avgPrice: numeric("avg_price").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.itemId, t.city, t.quality, t.date] }),
    index("volume_daily_item_idx").on(t.itemId),
  ],
);

// Precomputed per-item aggregates. All recipe math reads from here, never from the raw tables,
// so combinatoria de recetas x ciudades no pega directo contra filas crudas.
export const marketAggregates = pgTable("market_aggregates", {
  itemId: text("item_id").primaryKey(),
  quality: smallint("quality").notNull().default(1),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),

  // Reference price to SELL this item in a real city market: trimmed median of sell_price_min
  // across cities (both tails clipped — see lib/formulas/outliers.ts).
  sellRefPrice: numeric("sell_ref_price"),
  sellRefAgeSeconds: integer("sell_ref_age_seconds"),
  sellRefCitiesCount: smallint("sell_ref_cities_count").notNull().default(0),

  // Reference price to BUY this item as a material in a real city market: trimmed min of
  // sell_price_min across cities (low tail clipped only).
  buyRefPrice: numeric("buy_ref_price"),
  buyRefAgeSeconds: integer("buy_ref_age_seconds"),
  buyRefCitiesCount: smallint("buy_ref_cities_count").notNull().default(0),

  // Black Market: only buy orders exist, so the reference to SELL here is buy_price_max.
  // No cross-city comparison is possible (it's a single venue), so it is instead checked
  // against the 30d volume-weighted avg price and discarded (set to null) if it deviates
  // beyond the same 2.5x threshold used elsewhere.
  bmSellPrice: numeric("bm_sell_price"),
  bmSellAgeSeconds: integer("bm_sell_age_seconds"),
  bmDiscardReason: text("bm_discard_reason"),

  avgDailyVolume30d: numeric("avg_daily_volume_30d").notNull().default("0"),
  bmAvgDailyVolume30d: numeric("bm_avg_daily_volume_30d").notNull().default("0"),
  daysWithVolume30d: smallint("days_with_volume_30d").notNull().default(0),

  qualityScore: smallint("quality_score").notNull().default(0),
  brecilienCovered: boolean("brecilien_covered").notNull().default(false),

  // [{city, field, price, reason}] — every quote excluded by outlier trimming, kept for the
  // row detail view so nothing is silently dropped.
  discarded: jsonb("discarded").$type<DiscardedQuote[]>().notNull().default([]),
});

export type DiscardedQuote = {
  city: string;
  field: "sell_price_min" | "buy_price_max";
  price: number;
  reason: "outlier_low" | "outlier_high";
};
