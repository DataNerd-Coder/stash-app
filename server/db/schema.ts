// Stash database schema (Neon Postgres, via Drizzle ORM).
//
// Conventions:
// - Money is stored as integer kobo (₦1 = 100 kobo) in *_kobo columns — never floats.
// - Every business record carries business_id, so multiple businesses can share one database.
// - Moments are timestamptz; calendar dates (invoice date, debt date) are `date`.
//
// After changing this file: `pnpm db:generate` (writes SQL to drizzle/), then `pnpm db:migrate`.
import { sql } from "drizzle-orm";
import { bigint, date, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const kobo = (name: string) => bigint(name, { mode: "number" });
const businessId = () =>
  uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" });

export const businesses = pgTable("businesses", {
  id: id(),
  name: text("name").notNull(),
  ownerFirstName: text("owner_first_name").notNull(),
  ownerLastName: text("owner_last_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email"),
  /** IANA zone used for "today", "this month" etc. */
  timezone: text("timezone").notNull().default("Africa/Lagos"),
  createdAt: createdAt(),
});

export const products = pgTable(
  "products",
  {
    id: id(),
    businessId: businessId(),
    name: text("name").notNull(),
    unit: text("unit").notNull(), // "carton"
    unitPlural: text("unit_plural").notNull(), // "cartons"
    costKobo: kobo("cost_kobo").notNull(),
    /** owner-set selling price; null = "Not set" */
    sellingPriceKobo: kobo("selling_price_kobo"),
    stockUnits: integer("stock_units").notNull().default(0),
    /** "full shelf" level used for the low-stock bar; 0 = don't track */
    targetStock: integer("target_stock").notNull().default(0),
    expiryDate: date("expiry_date"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("products_business_name_idx").on(t.businessId, t.name)],
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: id(),
    businessId: businessId(),
    name: text("name").notNull(),
    productNames: text("product_names").array().notNull().default(sql`'{}'::text[]`),
    outstandingKobo: kobo("outstanding_kobo").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("suppliers_business_idx").on(t.businessId)],
);

export const sales = pgTable(
  "sales",
  {
    id: id(),
    businessId: businessId(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    /** name as recorded, kept even if the product is later renamed/deleted */
    productName: text("product_name").notNull(),
    qty: integer("qty").notNull(),
    amountKobo: kobo("amount_kobo").notNull(),
    /** total cost of the goods sold, snapshotted at sale time; null if unknown */
    costKobo: kobo("cost_kobo"),
    soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [index("sales_business_sold_at_idx").on(t.businessId, t.soldAt)],
);

export const purchases = pgTable(
  "purchases",
  {
    id: id(),
    businessId: businessId(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    qty: integer("qty").notNull(),
    unitCostKobo: kobo("unit_cost_kobo").notNull(),
    purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [index("purchases_business_purchased_at_idx").on(t.businessId, t.purchasedAt)],
);

export const expenses = pgTable(
  "expenses",
  {
    id: id(),
    businessId: businessId(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    amountKobo: kobo("amount_kobo").notNull(),
    spentAt: timestamp("spent_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [index("expenses_business_spent_at_idx").on(t.businessId, t.spentAt)],
);

export const debts = pgTable(
  "debts",
  {
    id: id(),
    businessId: businessId(),
    customerName: text("customer_name").notNull(),
    amountKobo: kobo("amount_kobo").notNull(),
    /** still owed; 0 = settled */
    balanceKobo: kobo("balance_kobo").notNull(),
    incurredOn: date("incurred_on").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("debts_business_idx").on(t.businessId)],
);

export const supplierOffers = pgTable("supplier_offers", {
  id: id(),
  businessId: businessId(),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  offerCostKobo: kobo("offer_cost_kobo").notNull(),
  createdAt: createdAt(),
});

export const invoiceStatus = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue"]);

export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    businessId: businessId(),
    number: text("number").notNull(),
    customerName: text("customer_name").notNull(),
    amountKobo: kobo("amount_kobo").notNull(),
    issuedOn: date("issued_on").notNull(),
    status: invoiceStatus("status").notNull().default("draft"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("invoices_business_number_idx").on(t.businessId, t.number)],
);

export const bankAccounts = pgTable("bank_accounts", {
  id: id(),
  businessId: businessId(),
  bankName: text("bank_name").notNull(),
  accountTail: text("account_tail").notNull(),
  createdAt: createdAt(),
});

export const bankTxnStatus = pgEnum("bank_txn_status", ["matched", "review", "unmatched"]);

export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: id(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => bankAccounts.id, { onDelete: "cascade" }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    /** positive = money in, negative = money out */
    amountKobo: kobo("amount_kobo").notNull(),
    description: text("description").notNull(),
    status: bankTxnStatus("status").notNull().default("unmatched"),
    /** what it was reconciled against, e.g. "Indomie sale" */
    matchedTo: text("matched_to"),
    createdAt: createdAt(),
  },
  (t) => [index("bank_transactions_account_occurred_idx").on(t.accountId, t.occurredAt)],
);

// ---- Auth ----

export const users = pgTable(
  "users",
  {
    id: id(),
    businessId: businessId(),
    name: text("name").notNull(),
    /** normalised Nigerian format, e.g. 08031234567 */
    phone: text("phone").notNull(),
    /** scrypt: "scrypt$<salt hex>$<hash hex>" */
    passwordHash: text("password_hash").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_phone_idx").on(t.phone)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** sha256 of the session token — the raw token only ever lives in the cookie */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);
