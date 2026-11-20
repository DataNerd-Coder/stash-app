// Read queries for the list pages.
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import type { Debt, Expense, Invoice, InvoiceStatus, Period, Sale, StockRecord, SuppliersResponse } from "../../src/data/types.js";
import type { CurrentBusiness } from "../business.js";
import { getDb, schema } from "../db/client.js";
import { num, toNaira } from "../money.js";
import { inPeriod } from "../time.js";

const { sales, purchases, expenses, debts, suppliers, supplierOffers, products, invoices } = schema;

/** Purchased & sold within the period; remaining is always current stock. */
export async function getStockRecords(biz: CurrentBusiness, period: Period): Promise<StockRecord[]> {
  const { rows } = await getDb().execute(sql`
    select p.name,
      coalesce((select sum(qty) from ${purchases}
                where ${purchases.productId} = p.id and ${inPeriod(purchases.purchasedAt, period, biz.timezone)}), 0) as purchased,
      coalesce((select sum(qty) from ${sales}
                where ${sales.productId} = p.id and ${inPeriod(sales.soldAt, period, biz.timezone)}), 0) as sold,
      p.stock_units as remaining
    from products p
    where p.business_id = ${biz.id}
    order by p.name
  `);
  return rows.map((r) => ({
    product: r.name as string,
    purchased: num(r.purchased as string),
    sold: num(r.sold as string),
    remaining: num(r.remaining as number),
  }));
}

export async function listSales(biz: CurrentBusiness, period: Period): Promise<Sale[]> {
  const rows = await getDb()
    .select()
    .from(sales)
    .where(and(eq(sales.businessId, biz.id), inPeriod(sales.soldAt, period, biz.timezone)))
    .orderBy(desc(sales.soldAt))
    .limit(200);
  return rows.map((s) => ({
    id: s.id,
    soldAt: s.soldAt.toISOString(),
    product: s.productName,
    qty: s.qty,
    amount: toNaira(s.amountKobo),
    profit: s.costKobo === null ? null : toNaira(s.amountKobo - s.costKobo),
  }));
}

export async function listExpenses(biz: CurrentBusiness, period: Period): Promise<Expense[]> {
  const rows = await getDb()
    .select()
    .from(expenses)
    .where(and(eq(expenses.businessId, biz.id), inPeriod(expenses.spentAt, period, biz.timezone)))
    .orderBy(desc(expenses.spentAt))
    .limit(200);
  return rows.map((e) => ({
    id: e.id,
    spentAt: e.spentAt.toISOString(),
    description: e.description,
    category: e.category,
    amount: toNaira(e.amountKobo),
  }));
}

/** Unsettled customer debts, newest first. */
export async function listDebts(biz: CurrentBusiness): Promise<Debt[]> {
  const rows = await getDb()
    .select()
    .from(debts)
    .where(and(eq(debts.businessId, biz.id), gt(debts.balanceKobo, 0)))
    .orderBy(desc(debts.incurredOn));
  return rows.map((d) => ({
    id: d.id,
    customer: d.customerName,
    amount: toNaira(d.amountKobo),
    balance: toNaira(d.balanceKobo),
    incurredOn: d.incurredOn,
    status: d.balanceKobo < d.amountKobo ? "Partly paid" : "Outstanding",
  }));
}

export async function listSuppliers(biz: CurrentBusiness): Promise<SuppliersResponse> {
  const db = getDb();
  const [supplierRows, offerRows] = await Promise.all([
    db.select().from(suppliers).where(eq(suppliers.businessId, biz.id)).orderBy(asc(suppliers.name)),
    db
      .select({
        product: products.name,
        usualCost: products.costKobo,
        offerCost: supplierOffers.offerCostKobo,
        supplier: suppliers.name,
      })
      .from(supplierOffers)
      .innerJoin(products, eq(products.id, supplierOffers.productId))
      .innerJoin(suppliers, eq(suppliers.id, supplierOffers.supplierId))
      .where(eq(supplierOffers.businessId, biz.id))
      .orderBy(desc(supplierOffers.createdAt)),
  ]);
  return {
    suppliers: supplierRows.map((s) => ({ id: s.id, name: s.name, products: s.productNames, outstanding: toNaira(s.outstandingKobo) })),
    // only offers that are genuinely cheaper than what the owner pays now
    offers: offerRows
      .filter((o) => o.offerCost < o.usualCost)
      .map((o) => ({ product: o.product, usualCost: toNaira(o.usualCost), offerCost: toNaira(o.offerCost), supplier: o.supplier })),
  };
}

const invoiceLabel: Record<(typeof invoices.status.enumValues)[number], InvoiceStatus> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

export async function listInvoices(biz: CurrentBusiness): Promise<Invoice[]> {
  const rows = await getDb()
    .select()
    .from(invoices)
    .where(eq(invoices.businessId, biz.id))
    .orderBy(desc(invoices.issuedOn), desc(invoices.number));
  return rows.map((i) => ({
    id: i.id,
    number: i.number,
    customer: i.customerName,
    amount: toNaira(i.amountKobo),
    issuedOn: i.issuedOn,
    status: invoiceLabel[i.status],
  }));
}
