CREATE TABLE "market_aggregates" (
	"item_id" text NOT NULL,
	"city" text NOT NULL,
	"quality" smallint DEFAULT 1 NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"price" numeric,
	"price_age_seconds" integer,
	"avg_daily_volume_30d" numeric DEFAULT '0' NOT NULL,
	"days_with_volume_30d" smallint DEFAULT 0 NOT NULL,
	"weighted_avg_price_30d" numeric,
	CONSTRAINT "market_aggregates_item_id_city_quality_pk" PRIMARY KEY("item_id","city","quality")
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