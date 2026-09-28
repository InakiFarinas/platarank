ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "actual_cost" numeric;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "actual_revenue" numeric;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "name_pt" text;