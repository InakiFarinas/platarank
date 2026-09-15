ALTER TABLE "recipes" ADD COLUMN "crafting_category" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "max_quality_level" smallint DEFAULT 1 NOT NULL;