import { getCurrentBusiness } from "../server/business.js";
import { route, searchParam } from "../server/http.js";
import { getStockRecords } from "../server/services/records.js";
import { parsePeriod } from "../server/time.js";

/** GET /api/stock-records?period=today|7d|month|all */
export const GET = route(async (request) => getStockRecords(await getCurrentBusiness(request), parsePeriod(searchParam(request, "period"), "7d")));
