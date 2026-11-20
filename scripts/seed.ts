// Loads demo data (Chidi's Provisions) into the database.
//
//   pnpm db:seed           — only if the database has no business yet
//   pnpm db:seed --reset   — DELETES ALL business data first, then reseeds
//
// Sales/purchases are generated for the last 30 days relative to *now*, so the
// dashboard always has a "today". Re-run with --reset to refresh the demo.
import { neon } from "@neondatabase/serverless";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../server/db/schema.js";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (expected in .env.local).");
  process.exit(1);
}
const db = drizzle(neon(url), { schema });
const reset = process.argv.includes("--reset");

// ---------------------------------------------------------------------------
// time helpers — Africa/Lagos is UTC+1 all year (no DST)
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.now();
const lagosNow = new Date(now + LAGOS_OFFSET_MS);
const todayStartUtc = Date.UTC(lagosNow.getUTCFullYear(), lagosNow.getUTCMonth(), lagosNow.getUTCDate()) - LAGOS_OFFSET_MS;
const hoursIntoToday = (now - todayStartUtc) / 3_600_000;

/** A moment `daysAgo` days back at a Lagos local time. */
const at = (daysAgo: number, hour: number, minute = 0) => new Date(todayStartUtc - daysAgo * DAY_MS + (hour * 60 + minute) * 60_000);
/** A Lagos calendar date, `daysAgo` days back, as YYYY-MM-DD (negative = future). */
const day = (daysAgo: number) => new Date(todayStartUtc + LAGOS_OFFSET_MS - daysAgo * DAY_MS).toISOString().slice(0, 10);
/** A moment earlier today, never in the future. */
const earlierToday = (hoursBack: number) => new Date(Math.max(todayStartUtc + 60_000, now - hoursBack * 3_600_000));

// deterministic pseudo-random numbers, so every seed looks the same
let seed = 20261120;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const naira = (n: number) => Math.round(n * 100); // -> kobo

// ---------------------------------------------------------------------------
// catalogue: cost & typical selling price (₦), stock, "full shelf" target, expiry, sales weight
const catalogue = [
  { name: "Indomie (1 carton)", unit: "carton", unitPlural: "cartons", cost: 12000, sell: 13500, stock: 17, target: 40, expiresIn: null, weight: 6 },
  { name: "Peak Milk (400g)", unit: "carton", unitPlural: "cartons", cost: 3500, sell: 4000, stock: 12, target: 30, expiresIn: 18, weight: 3 },
  { name: "Coca-Cola (50cl)", unit: "crate", unitPlural: "crates", cost: 2800, sell: 3300, stock: 9, target: 30, expiresIn: 5, weight: 4 },
  { name: "Golden Morn (500g)", unit: "pack", unitPlural: "packs", cost: 2200, sell: 2600, stock: 3, target: 25, expiresIn: 2, weight: 2 },
  { name: "Pure Water (75cl)", unit: "pack", unitPlural: "packs", cost: 900, sell: 1100, stock: 15, target: 30, expiresIn: null, weight: 4 },
  { name: "Milo (500g tin)", unit: "tin", unitPlural: "tins", cost: 3100, sell: 3600, stock: 10, target: 22, expiresIn: null, weight: 2 },
  { name: "Yoghurt (500ml)", unit: "bottle", unitPlural: "bottles", cost: 700, sell: 900, stock: 6, target: 12, expiresIn: -1, weight: 1 },
  { name: "Bread (loaf)", unit: "loaf", unitPlural: "loaves", cost: 600, sell: 800, stock: 4, target: 20, expiresIn: 1, weight: 3 },
  { name: "Milk (1L)", unit: "unit", unitPlural: "units", cost: 1200, sell: 1500, stock: 24, target: 30, expiresIn: 25, weight: 2 },
  { name: "Maltina (Can)", unit: "can", unitPlural: "cans", cost: 550, sell: 700, stock: 0, target: 24, expiresIn: null, weight: 1 },
  { name: "Maggi Star (Pack)", unit: "pack", unitPlural: "packs", cost: 1800, sell: 2100, stock: 30, target: 30, expiresIn: null, weight: 2 },
  { name: "Three Crowns Milk (400g)", unit: "tin", unitPlural: "tins", cost: 1500, sell: 1800, stock: 8, target: 16, expiresIn: null, weight: 1 },
];

const supplierList = [
  { name: "ABC Distributors", products: ["Indomie", "Peak Milk", "Coca-Cola"], outstanding: 45000 },
  { name: "Lagos Beverages Ltd", products: ["Coca-Cola", "Pure Water"], outstanding: 0 },
  { name: "Golden Foods Supply", products: ["Golden Morn", "Milo"], outstanding: 12000 },
];

async function main() {
  const [{ value: existing }] = await db.select({ value: count() }).from(schema.businesses);
  if (existing > 0 && !reset) {
    console.log(`Database already has ${existing} business(es) — nothing to do. Use \`pnpm db:seed --reset\` to wipe and reseed.`);
    return;
  }
  if (reset) {
    await db.delete(schema.businesses); // cascades to every business-owned table
    console.log("✓ Cleared existing data");
  }

  const [biz] = await db
    .insert(schema.businesses)
    .values({
      name: "Chidi's Provisions",
      ownerFirstName: "Michael",
      ownerLastName: "Chidi",
      phone: "0803 123 4567",
      email: "michael@chidisprovisions.com",
    })
    .returning();
  const businessId = biz.id;

  const productRows = await db
    .insert(schema.products)
    .values(
      catalogue.map((p) => ({
        businessId,
        name: p.name,
        unit: p.unit,
        unitPlural: p.unitPlural,
        costKobo: naira(p.cost),
        stockUnits: p.stock,
        targetStock: p.target,
        expiryDate: p.expiresIn === null ? null : day(-p.expiresIn),
      })),
    )
    .returning({ id: schema.products.id, name: schema.products.name });
  const productId = (name: string) => productRows.find((r) => r.name === name)!.id;

  const supplierRows = await db
    .insert(schema.suppliers)
    .values(supplierList.map((s) => ({ businessId, name: s.name, productNames: s.products, outstandingKobo: naira(s.outstanding) })))
    .returning({ id: schema.suppliers.id, name: schema.suppliers.name, productNames: schema.suppliers.productNames });
  const supplierFor = (productName: string) => supplierRows.find((s) => s.productNames.some((n) => productName.startsWith(n)))?.id ?? null;

  // ---- 30 days of sales ----
  const totalWeight = catalogue.reduce((s, p) => s + p.weight, 0);
  const pickProduct = () => {
    let r = rand() * totalWeight;
    for (const p of catalogue) if ((r -= p.weight) < 0) return p;
    return catalogue[0];
  };
  const saleRows: (typeof schema.sales.$inferInsert)[] = [];
  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    let n = randInt(22, 34);
    let fromHour = 7;
    let toHour = 21;
    if (daysAgo === 0) {
      // today: only the part of the trading day that has already happened
      toHour = Math.min(21, hoursIntoToday - 0.05);
      fromHour = Math.min(7, Math.max(0, toHour - 1));
      n = Math.max(3, Math.round(n * Math.min(1, Math.max(0.2, (toHour - 7) / 14))));
    }
    for (let i = 0; i < n; i++) {
      const p = pickProduct();
      const qty = rand() < 0.7 ? randInt(1, 3) : randInt(4, 8);
      const hours = fromHour + rand() * (toHour - fromHour);
      saleRows.push({
        businessId,
        productId: productId(p.name),
        productName: p.name,
        qty,
        amountKobo: naira(qty * p.sell),
        costKobo: naira(qty * p.cost),
        soldAt: at(daysAgo, 0, Math.floor(hours * 60)),
      });
    }
  }
  await db.insert(schema.sales).values(saleRows);

  // ---- restocks every 5 days ----
  const purchaseRows: (typeof schema.purchases.$inferInsert)[] = [];
  for (const daysAgo of [28, 23, 18, 13, 8, 3]) {
    for (const p of catalogue) {
      purchaseRows.push({
        businessId,
        productId: productId(p.name),
        supplierId: supplierFor(p.name),
        qty: randInt(5, 20),
        unitCostKobo: naira(p.cost),
        purchasedAt: at(daysAgo, randInt(8, 11), randInt(0, 59)),
      });
    }
  }
  await db.insert(schema.purchases).values(purchaseRows);

  await db.insert(schema.expenses).values(
    [
      { description: "Transport to market", category: "Logistics", amount: 3000, spentAt: earlierToday(2) },
      { description: "Shop electricity", category: "Utilities", amount: 5000, spentAt: at(1, 10) },
      { description: "Nylon bags", category: "Supplies", amount: 1500, spentAt: at(3, 9) },
      { description: "Shop assistant wages", category: "Salaries", amount: 15000, spentAt: at(5, 18) },
      { description: "Fuel for generator", category: "Utilities", amount: 8000, spentAt: at(9, 8) },
      { description: "Transport to market", category: "Logistics", amount: 2500, spentAt: at(12, 7) },
      { description: "Shop assistant wages", category: "Salaries", amount: 15000, spentAt: at(19, 18) },
    ].map((e) => ({ businessId, description: e.description, category: e.category, amountKobo: naira(e.amount), spentAt: e.spentAt })),
  );

  await db.insert(schema.debts).values([
    { businessId, customerName: "Chinedu", amountKobo: naira(20000), balanceKobo: naira(20000), incurredOn: day(8) },
    { businessId, customerName: "Ngozi", amountKobo: naira(8500), balanceKobo: naira(8500), incurredOn: day(6) },
    { businessId, customerName: "Emeka", amountKobo: naira(15000), balanceKobo: naira(6000), incurredOn: day(18) },
  ]);

  await db.insert(schema.supplierOffers).values({
    businessId,
    supplierId: supplierRows.find((s) => s.name === "Golden Foods Supply")!.id,
    productId: productId("Peak Milk (400g)"),
    offerCostKobo: naira(3200),
  });

  await db.insert(schema.invoices).values([
    { businessId, number: "INV-0042", customerName: "Chinedu", amountKobo: naira(150000), issuedOn: day(1), status: "sent" },
    { businessId, number: "INV-0041", customerName: "Blessing Stores", amountKobo: naira(82000), issuedOn: day(4), status: "paid" },
    { businessId, number: "INV-0040", customerName: "Ngozi", amountKobo: naira(30000), issuedOn: day(10), status: "overdue" },
    { businessId, number: "INV-0039", customerName: "Kelvin Mart", amountKobo: naira(60000), issuedOn: day(13), status: "draft" },
  ]);

  const [account] = await db.insert(schema.bankAccounts).values({ businessId, bankName: "GTBank", accountTail: "4821" }).returning();
  await db.insert(schema.bankTransactions).values([
    { accountId: account.id, occurredAt: earlierToday(1), amountKobo: naira(12000), description: "POS credit", status: "matched", matchedTo: "Indomie sale" },
    { accountId: account.id, occurredAt: earlierToday(3), amountKobo: naira(4800), description: "Transfer received", status: "matched", matchedTo: "Coca-Cola sale" },
    { accountId: account.id, occurredAt: earlierToday(5), amountKobo: naira(85000), description: "Transfer received — CHINEDU O.", status: "review" },
    { accountId: account.id, occurredAt: at(1, 18, 15), amountKobo: naira(-5000), description: "Debit — IKEDC", status: "unmatched" },
  ]);

  console.log(`✓ Seeded "${biz.name}": ${productRows.length} products, ${saleRows.length} sales, ${purchaseRows.length} purchases`);
}

await main();
