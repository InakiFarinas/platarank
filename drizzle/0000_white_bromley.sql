CREATE TABLE "market_aggregates" (
	"item_id" text PRIMARY KEY NOT NULL,
	"quality" smallint DEFAULT 1 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sell_ref_price" numeric,
	"sell_ref_age_seconds" integer,
	"sell_ref_cities_count" smallint DEFAULT 0 NOT NULL,
	"buy_ref_price" numeric,
	"buy_ref_age_seconds" integer,
	"buy_ref_cities_count" smallint DEFAULT 0 NOT NULL,
	"bm_sell_price" numeric,
	"bm_sell_age_seconds" integer,
	"bm_discard_reason" text,
	"avg_daily_volume_30d" numeric DEFAULT '0' NOT NULL,
	"bm_avg_daily_volume_30d" numeric DEFAULT '0' NOT NULL,
	"days_with_volume_30d" smallint DEFAULT 0 NOT NULL,
	"quality_score" smallint DEFAULT 0 NOT NULL,
	"brecilien_covered" boolean DEFAULT false NOT NULL,
	"discarded" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_quotes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "price_quotes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"item_id" text NOT NULL,
	"city" text NOT NULL,
	"quality" smallint DEFAULT 1 NOT NULL,
	"sell_price_min" numeric,
	"sell_price_min_date" timestamp with time zone,
	"sell_price_max" numeric,
	"sell_price_max_date" timestamp with time zone,
	"buy_price_min" numeric,
	"buy_price_min_date" timestamp with time zone,
	"buy_price_max" numeric,
	"buy_price_max_date" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"item_id" text PRIMARY KEY NOT NULL,
	"base_item_id" text NOT NULL,
	"name_es" text NOT NULL,
	"name_en" text NOT NULL,
	"tier" smallint NOT NULL,
	"enchant" smallint NOT NULL,
	"station_type" text NOT NULL,
	"batch_size" smallint NOT NULL,
	"crafting_focus" integer NOT NULL,
	"materials" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volume_daily" (
	"item_id" text NOT NULL,
	"city" text NOT NULL,
	"quality" smallint DEFAULT 1 NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"item_count" integer NOT NULL,
	"avg_price" numeric NOT NULL,
	CONSTRAINT "volume_daily_item_id_city_quality_date_pk" PRIMARY KEY("item_id","city","quality","date")
);
--> statement-breakpoint
CREATE INDEX "price_quotes_item_city_idx" ON "price_quotes" USING btree ("item_id","city","fetched_at");--> statement-breakpoint
CREATE INDEX "volume_daily_item_idx" ON "volume_daily" USING btree ("item_id");