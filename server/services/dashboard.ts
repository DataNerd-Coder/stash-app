import { sql, type SQL } from "drizzle-orm";
import type { Dashboard, TopProduct, WeekBar } from "../../src/data/types.js";
import type { CurrentBusiness } from "../business.js";
import { getDb } from "../db/client.js";
import { num, toNaira } from "../money.js";
import { weekdayLetter } from "../time.js";
import { listProducts, lowStockFrom, needsAttention } from "./products.js";

/** Daily sales totals for the last 7 days (oldest first), scaled to the best day. */
export async function getWeekBars(biz: CurrentBusiness): Promise<WeekBar[]> {
  const { rows } = await getDb().execute(sql`
    select d.day::text as day, coalesce(sum(s.amount_kobo), 0) as total
    from generate_series(0, 6) as g(i)
    cross join lateral (select (now() at time zone ${biz.timezone})::date - g.i as day) d
    left join sales s on s.business_id = ${biz.id} and (s.sold_at at time zone ${biz.timezone})::date = d.day
    group by d.day
    order by d.day
  `);
  const totals = rows.map((r) => num(r.total as string));
  const max = Math.max(...totals, 1);
  return rows.map((r, i) => ({
    label: weekdayLetter(r.day as string),
    pct: Math.max(Math.round((totals[i] / max) * 100), totals[i] > 0 ? 4 : 2),
    today: i === rows.length - 1 || undefined,
  }));
}

/** Best sellers by revenue among sales matching `where` (a condition on `sales`). */
export async function getTopProducts(biz: CurrentBusiness, where: SQL, limit = 3): Promise<TopProduct[]> {
  const { rows } = await getDb().execute(sql`
    select coalesce(p.name, s.product_name) as name,
           max(coalesce(p.unit_plural, 'units')) as unit_plural,
           sum(s.qty) as units,
           sum(s.amount_kobo) as revenue,
           sum(sum(s.amount_kobo)) over () as period_total
    from sales s
    left join products p on p.id = s.product_id
    where s.business_id = ${biz.id} and ${where}
    group by 1
    order by revenue desc
    limit ${limit}
  `);
  return rows.map((r, i) => {
    const revenue = num(r.revenue as string);
    const total = num(r.period_total as string);
    return {
      rank: String(i + 1).padStart(2, "0"),
      name: r.name as string,
      units: num(r.units as string),
      unitLabel: `${r.unit_plural as string} sold`,
      revenue: toNaira(revenue),
      share: total > 0 ? Math.round((revenue / total) * 100) : 0,
    };
  });
}

export async function getDashboard(biz: CurrentBusiness): Promise<Dashboard> {
  const tz = biz.timezone;
  const isToday = sql`(s.sold_at at time zone ${tz})::date = (now() at time zone ${tz})::date`;

  const [totals, weekBars, topProducts, products] = await Promise.all([
    getDb().execute(sql`
      select
        coalesce(sum(amount_kobo) filter (where day = today), 0) as today_total,
        count(*) filter (where day = today) as today_count,
        -- yesterday only up to the current time of day, so a morning isn't
        -- compared against a whole day ("-80%!") — like-for-like
        coalesce(sum(amount_kobo) filter (where day = today - 1 and clock <= now_clock), 0) as yesterday_total
      from (
        select amount_kobo,
               (sold_at at time zone ${tz})::date as day,
               (sold_at at time zone ${tz})::time as clock,
               (now() at time zone ${tz})::date as today,
               (now() at time zone ${tz})::time as now_clock
        from sales
        where business_id = ${biz.id} and sold_at > now() - interval '3 days'
      ) recent
    `),
    getWeekBars(biz),
    getTopProducts(biz, isToday),
    listProducts(biz),
  ]);

  const t = totals.rows[0];
  const todayTotal = num(t.today_total as string);
  const yesterdayTotal = num(t.yesterday_total as string);
  const top = topProducts[0];

  return {
    today: {
      totalSales: toNaira(todayTotal),
      salesCount: num(t.today_count as string),
      changePct: yesterdayTotal > 0 ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 1000) / 10 : null,
      weekBars,
    },
    topProducts,
    lowStock: lowStockFrom(products),
    attentionCount: products.filter(needsAttention).length,
    insight: top ? { productName: top.name, units: top.units, unitPlural: top.unitLabel.replace(/ sold$/, ""), revenue: top.revenue } : null,
  };
}
