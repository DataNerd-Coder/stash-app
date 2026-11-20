import { endSession } from "../../server/auth.js";
import { json, route } from "../../server/http.js";

/** POST /api/auth/logout */
export const POST = route(async (request) => json({ ok: true }, { headers: { "Set-Cookie": await endSession(request) } }));
