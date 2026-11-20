import { getCurrentBusiness } from "../server/business.js";
import { route } from "../server/http.js";
import { listDebts } from "../server/services/records.js";

/** GET /api/debts — unsettled customer debts */
export const GET = route(async (request) => listDebts(await getCurrentBusiness(request)));
