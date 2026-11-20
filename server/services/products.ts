import { sql } from "drizzle-orm";
import type { LowStockItem, Product } from "../../src/data/types.js";
import type { CurrentBusiness } from "../business.js";
import { getDb } from "../db/client.js";
import { num, toNaira } from "../money.js";

interface ProductRow extends Product {
  targetStock: number;
}

const unitLabel = (count: number, unit: string, plural: string) => `${count} ${count === 1 ? unit : plural}`;

/** All products, with expiry and real average selling price from recorded sales. */
export async function listProducts(biz: CurrentBusiness): Promise<ProductRow[]> {
  const { rows } = await getDb().execute(sql`
    select p.id, p.name, p.unit, p.unit_plural, p.stock_units, p.target_stock, p.cost_kobo,
           p.expiry_date - (now() at time zone ${biz.timezone})::date as expiry_days,
           coalesce(s.units, 0) as sold_units,
           coalesce(s.amount, 0) as sold_amount,
           coalesce(s.cnt, 0) as sales_count
    from products p
    left join (
      select product_id, sum(qty) as units, sum(amount_kobo) as amount, count(*) as cnt
      from sales where business_id = ${biz.id} group by product_id
    ) s on s.product_id = p.id
    where p.business_id = ${biz.id}
    order by p.name
  `);

  return rows.map((r) => {
    const stockUnits = num(r.stock_units as number);
    const soldUnits = num(r.sold_units as string);
    const expiryDays = r.expiry_days === null ? null : num(r.expiry_days as number);
    return {
      id: r.id as string,
      name: r.name as string,
      unit: r.unit as string,
      unitPlural: r.unit_plural as string,
      stockUnits,
      targetStock: num(r.target_stock as number),
      qtyLabel: unitLabel(stockUnits, r.unit as string, r.unit_plural as string),
      cost: toNaira(r.cost_kobo as string),
      expiryDays,
      expired: expiryDays !== null && expiryDays < 0,
      avgSellingPrice: soldUnits > 0 ? toNaira(r.sold_amount as string) / soldUnits : null,
      salesCount: num(r.sales_count as string),
    };
  });
}

/** Strip server-only fields before sending to the client. */
export const publicProduct = ({ targetStock: _targetStock, ...p }: ProductRow): Product => p;

/** Products below half of their target stock, lowest first. "danger" at or below 20%. */
export function lowStockFrom(products: ProductRow[]): LowStockItem[] {
  return products
    .filter((p) => p.targetStock > 0 && p.stockUnits * 2 < p.targetStock)
    .map((p) => ({ p, pct: Math.round((p.stockUnits / p.targetStock) * 100) }))
    .sort((a, b) => a.pct - b.pct)
    .map(({ p, pct }) => ({
      name: p.name,
      remaining: `${unitLabel(p.stockUnits, p.unit, p.unitPlural)} left`,
      pct,
      level: pct <= 20 ? "danger" : "warn",
    }));
}

export const needsAttention = (p: Product) => p.expired || (p.expiryDays !== null && p.expiryDays <= 7);
