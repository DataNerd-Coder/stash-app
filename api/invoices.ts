import { getCurrentBusiness } from "../server/business.js";
import { route } from "../server/http.js";
import { listInvoices } from "../server/services/records.js";

/** GET /api/invoices */
export const GET = route(async (request) => listInvoices(await getCurrentBusiness(request)));
