import { getCurrentBusiness } from "../server/business.js";
import { route } from "../server/http.js";
import { listProducts, lowStockFrom, publicProduct } from "../server/services/products.js";

/**
 * GET /api/products            — all products
 * GET /api/products?view=low   — "almost out of stock" list
 */
export const GET = route(async (request) => {
  const products = await listProducts(await getCurrentBusiness());
  if (new URL(request.url).searchParams.get("view") === "low") return lowStockFrom(products);
  return products.map(publicProduct);
});
