import { getCurrentBusiness } from "../server/business.js";
import { route } from "../server/http.js";
import { getReports } from "../server/services/reports.js";

/** GET /api/reports — last-30-day totals, 7-day trend, best sellers, expense breakdown */
export const GET = route(async () => getReports(await getCurrentBusiness()));
