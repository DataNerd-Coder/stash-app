import { getCurrentBusiness } from "../server/business.js";
import { route } from "../server/http.js";
import { listSuppliers } from "../server/services/records.js";

/** GET /api/suppliers — suppliers plus cheaper offers spotted from purchase history */
export const GET = route(async () => listSuppliers(await getCurrentBusiness()));
