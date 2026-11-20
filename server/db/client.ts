import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

export type Db = NeonHttpDatabase<typeof schema>;

let db: Db | undefined;

/**
 * Neon's HTTP driver: each query is a single HTTPS request, which suits
 * serverless functions (no connection pool to manage or exhaust).
 */
export function getDb(): Db {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local (local) or the Vercel project settings.");
    db = drizzle(neon(url), { schema });
  }
  return db;
}

export { schema };
