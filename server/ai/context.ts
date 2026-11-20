// Builds the compact, plain-text snapshot of the business that the AI answers from.
// It's rebuilt on every chat message, so answers always reflect the latest data.
// Kept small on purpose: Groq's free tier allows ~8K tokens per minute.
import { formatNaira } from "../../src/lib/format.js";
import { getCurrentBusiness, type CurrentBusiness } from "../business.js";
import { getDashboard } from "../services/dashboard.js";
import { listProducts, lowStockFrom } from "../services/products.js";
import { getProfile } from "../services/profile.js";
import { listDebts, listExpenses, listInvoices, listSuppliers } from "../services/records.js";
import { getReports } from "../services/reports.js";

const n = formatNaira;

function localNow(tz: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

const localDay = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric", month: "short" }).format(new Date(iso));

export async function buildBusinessContext(biz?: CurrentBusiness): Promise<string> {
  const b = biz ?? (await getCurrentBusiness());
  const [profile, dashboard, products, reports, debts, invoices, suppliers, expenses] = await Promise.all([
    getProfile(b),
    getDashboard(b),
    listProducts(b),
    getReports(b),
    listDebts(b),
    listInvoices(b),
    listSuppliers(b),
    listExpenses(b, "7d"),
  ]);

  const t = dashboard.today;
  const lines: string[] = [];
  lines.push(`Business: ${profile.name}. Owner: ${profile.ownerFirstName} ${profile.ownerLastName}`.trim() + ".");
  lines.push(`Now: ${localNow(b.timezone)} (${b.timezone}). Currency: Naira (₦).`);

  lines.push("", "TODAY");
  lines.push(
    `Sales: ${n(t.totalSales)} from ${t.salesCount} sales.` +
      (t.changePct === null ? "" : ` Change vs same time yesterday: ${t.changePct > 0 ? "+" : ""}${t.changePct}%.`),
  );
  if (dashboard.topProducts.length) {
    lines.push(`Top sellers today: ${dashboard.topProducts.map((p) => `${p.name} (${p.units} ${p.unitLabel}, ${n(p.revenue)})`).join("; ")}.`);
  }

  lines.push("", "LAST 30 DAYS");
  lines.push(
    `Revenue ${n(reports.revenue30d)}, profit ${n(reports.profit30d)}` +
      (reports.marginPct === null ? "" : `, margin ${reports.marginPct}%`) +
      `, expenses ${n(reports.expenses30d)}.`,
  );
  if (reports.topProducts.length) {
    lines.push(`Best sellers: ${reports.topProducts.map((p) => `${p.name} ${n(p.revenue)} (${p.share}%)`).join("; ")}.`);
  }
  if (reports.expenseBreakdown.length) {
    lines.push(`Expenses by category: ${reports.expenseBreakdown.map((e) => `${e.category} ${n(e.amount)}`).join(", ")}.`);
  }

  lines.push("", "PRODUCTS (name | in stock | cost price | avg selling price | expiry)");
  for (const p of products) {
    const expiry = p.expiryDays === null ? "-" : p.expired ? "EXPIRED" : `in ${p.expiryDays}d`;
    const avg = p.avgSellingPrice === null ? "never sold" : n(Math.round(p.avgSellingPrice));
    lines.push(`- ${p.name} | ${p.qtyLabel} | ${n(p.cost)}/${p.unit} | ${avg} | ${expiry}`);
  }
  const low = lowStockFrom(products);
  if (low.length) lines.push(`Running low: ${low.map((s) => s.remaining.replace(/ left$/, "") + ` of ${s.name}`).join(", ")}.`);

  if (debts.length) {
    lines.push("", "CUSTOMERS WHO OWE THE BUSINESS");
    for (const d of debts) lines.push(`- ${d.customer}: owes ${n(d.balance)} (of ${n(d.amount)}), since ${d.incurredOn}`);
  }

  if (invoices.length) {
    lines.push("", "INVOICES");
    for (const i of invoices) lines.push(`- ${i.number} ${i.customer} ${n(i.amount)} ${i.status}, issued ${i.issuedOn}`);
  }

  if (suppliers.suppliers.length) {
    lines.push("", "SUPPLIERS (what they supply | what the business owes them)");
    for (const s of suppliers.suppliers) lines.push(`- ${s.name}: ${s.products.join(", ")} | owed ${n(s.outstanding)}`);
    for (const o of suppliers.offers) {
      lines.push(`Offer: ${o.supplier} sells ${o.product} at ${n(o.offerCost)} (usual cost ${n(o.usualCost)}).`);
    }
  }

  if (expenses.length) {
    lines.push("", "EXPENSES, LAST 7 DAYS");
    for (const e of expenses) lines.push(`- ${localDay(e.spentAt, b.timezone)}: ${e.description} (${e.category}) ${n(e.amount)}`);
  }

  return lines.join("\n");
}
