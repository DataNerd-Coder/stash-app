import { requireUser } from "./auth.js";

export interface CurrentBusiness {
  id: string;
  timezone: string;
}

/**
 * The signed-in user's business. Every query filters by this id, so one
 * owner can never see another business's records. Throws 401 when logged out.
 */
export async function getCurrentBusiness(request: Request): Promise<CurrentBusiness> {
  const user = await requireUser(request);
  return { id: user.businessId, timezone: user.timezone };
}
