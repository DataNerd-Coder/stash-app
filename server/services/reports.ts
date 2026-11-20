import { sql } from "drizzle-orm";
import type { Reports } from "../../src/data/types.js";
import type { CurrentBusiness } from "../business.js";
import { getDb } from "../db/client.js";
import { num, toNaira } from "../money.js";
import { getTopProducts, getWeekBars } from "./dashboard.js";

export async function getReports(biz: CurrentBusiness): Promise<Reports> {
  const last30Sales = sql`s.sold_at > now() - interval '30 days'`;

  const [totals, expenseRows, weekBars, topProducts] = await Promise.all([
    getDb().execute(sql`
      select coalesce(sum(amount_kobo), 0) as revenue,
             coalesce(sum(amount_kobo - cost_kobo) filter (where cost_kobo is not null), 0) as profit,
             coalesce(sum(amount_kobo) filter (where cost_kobo is not null), 0) as costed_revenue
      from sales s
      where s.business_id = ${biz.id} and ${last30Sales}
    `),
    getDb().execute(sql`
      select category, sum(amount_kobo) as amount
      from expenses
      where business_id = ${biz.id} and spent_at > now() - interval '30 days'
      group by category
      order by amount desc
    `),
    getWeekBars(biz),
    getTopProducts(biz, last30Sales),
  ]);

  const t = totals.rows[0];
  const profit = num(t.profit as string);
  const costedRevenue = num(t.costed_revenue as string);
  const expenseBreakdown = expenseRows.rows.map((r) => ({ category: r.category as string, amount: toNaira(r.amount as string) }));

  return {
    revenue30d: toNaira(t.revenue as string),
    profit30d: toNaira(profit),
    // margin only over sales whose cost is known, so unknown costs don't inflate it
    marginPct: costedRevenue > 0 ? Math.round((profit / costedRevenue) * 1000) / 10 : null,
    expenses30d: expenseBreakdown.reduce((sum, e) => sum + e.amount, 0),
    weekBars,
    topProducts,
    expenseBreakdown,
  };
}
