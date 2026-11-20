import type { Me } from "../../src/data/types.js";
import { getSessionUser } from "../../server/auth.js";
import { route } from "../../server/http.js";

/** GET /api/auth/me — the signed-in user, or null when logged out (not an error). */
export const GET = route(async (request): Promise<Me | null> => {
  const user = await getSessionUser(request);
  return user ? { name: user.name, phone: user.phone } : null;
});
