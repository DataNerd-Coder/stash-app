import { getCurrentBusiness } from "../server/business.js";
import { route, searchParam } from "../server/http.js";
import { listExpenses } from "../server/services/records.js";
import { parsePeriod } from "../server/time.js";

/** GET /api/expenses?period=today|7d|month|all */
export const GET = route(async (request) => listExpenses(await getCurrentBusiness(), parsePeriod(searchParam(request, "period"), "all")));
