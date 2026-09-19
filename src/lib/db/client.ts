import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Supabase poolers cap clients (15 in session mode): keep each process small so dev servers,
// scripts and serverless instances do not exhaust it (EMAXCONNSESSION).
const client = postgres(process.env.DATABASE_URL, { prepare: false, max: process.env.NODE_ENV === "production" ? 5 : 3 });

export const db = drizzle(client, { schema });
