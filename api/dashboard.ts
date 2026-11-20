import { getCurrentBusiness } from "../server/business.js";
import { route } from "../server/http.js";
import { getDashboard } from "../server/services/dashboard.js";

/** GET /api/dashboard — home screen: today's sales, top products, low stock, insight. */
export const GET = route(async (request) => getDashboard(await getCurrentBusiness(request)));
