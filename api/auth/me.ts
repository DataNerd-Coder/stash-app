import { requireUser } from "../../server/auth.js";
import { route } from "../../server/http.js";

/** GET /api/auth/me — the signed-in user, or 401 */
export const GET = route(async (request) => {
  const { name, phone } = await requireUser(request);
  return { name, phone };
});
