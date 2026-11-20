import type { BusinessUpdate } from "../src/data/types.js";
import { getCurrentBusiness } from "../server/business.js";
import { readJson, route } from "../server/http.js";
import { getProfile, updateProfile } from "../server/services/profile.js";

/** GET /api/business — business & owner details */
export const GET = route(async () => getProfile(await getCurrentBusiness()));

/** PUT /api/business { ownerName, businessName, phone } — signup / edit details */
export const PUT = route(async (request) => updateProfile(await getCurrentBusiness(), await readJson<Partial<BusinessUpdate>>(request)));
