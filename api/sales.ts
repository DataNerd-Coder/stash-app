import { getCurrentBusiness } from "../server/business.js";
import { route, searchParam } from "../server/http.js";
import { listSales } from "../server/services/records.js";
import { parsePeriod } from "../server/time.js";

/** GET /api/sales?period=today|7d|month|all */
export const GET = route(async (request) => listSales(await getCurrentBusiness(request), parsePeriod(searchParam(request, "period"), "today")));
