import { sql } from "drizzle-orm";
import { getDb } from "../server/db/client.js";
import { route } from "../server/http.js";

/** GET /api/health — checks the API can reach the database. */
export const GET = route(async () => {
  await getDb().execute(sql`select 1`);
  return { ok: true };
});
