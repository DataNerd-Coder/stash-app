import { asc } from "drizzle-orm";
import { getDb, schema } from "./db/client.js";
import { HttpError } from "./http.js";

export interface CurrentBusiness {
  id: string;
  timezone: string;
}

/**
 * The business whose data the API serves.
 *
 * TEMPORARY: there's no login yet, so this is simply the first business in the
 * database. Once auth is added, resolve it from the signed-in user's session
 * instead — every query already filters by business_id, so nothing else changes.
 */
export async function getCurrentBusiness(): Promise<CurrentBusiness> {
  const db = getDb();
  const [row] = await db
    .select({ id: schema.businesses.id, timezone: schema.businesses.timezone })
    .from(schema.businesses)
    .orderBy(asc(schema.businesses.createdAt))
    .limit(1);
  if (!row) throw new HttpError(503, "No business set up yet. Run `pnpm db:seed` to load demo data.");
  return row;
}
