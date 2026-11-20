// Tools the AI can call to record things the owner tells it about.
// Every tool validates its input, writes atomically (db.batch runs in one
// transaction on Neon) and returns a short plain-text result for the model.
import { and, eq, ilike, sql } from "drizzle-orm";
import { formatNaira } from "../../src/lib/format.js";
import type { CurrentBusiness } from "../business.js";
import { getDb, schema } from "../db/client.js";
import { toKobo } from "../money.js";
import type { ToolDefinition } from "./groq.js";

const { products, sales, expenses, purchases } = schema;

export const EXPENSE_CATEGORIES = ["Logistics", "Utilities", "Supplies", "Salaries", "Rent", "Other"] as const;

export const tools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "record_sale",
      description: "Record a sale the owner made. Reduces stock. Only call when product, quantity and total amount are all known.",
      parameters: {
        type: "object",
        properties: {
          product: { type: "string", description: "Product name as the owner said it, e.g. 'indomie'" },
          quantity: { type: "integer", minimum: 1, description: "Number of units sold (in the product's unit, e.g. cartons)" },
          total_amount: { type: "number", minimum: 1, description: "Total money received for this sale, in naira" },
        },
        required: ["product", "quantity", "total_amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_expense",
      description: "Record money the business spent (transport, electricity, wages, rent, bags...). Not for buying stock — use record_restock.",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Short description, e.g. 'Transport to market'" },
          category: { type: "string", enum: [...EXPENSE_CATEGORIES] },
          amount: { type: "number", minimum: 1, description: "Amount spent, in naira" },
        },
        required: ["description", "category", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_restock",
      description: "Record new stock the owner bought for resale. Increases stock.",
      parameters: {
        type: "object",
        properties: {
          product: { type: "string", description: "Product name as the owner said it" },
          quantity: { type: "integer", minimum: 1, description: "Number of units bought" },
          unit_cost: { type: "number", minimum: 1, description: "Cost per unit in naira, if the owner said it" },
        },
        required: ["product", "quantity"],
      },
    },
  },
];

export type ChangedResource = "sales" | "expenses" | "products";

export interface ToolResult {
  /** what the model sees */
  content: string;
  /** shown to the owner and kept in chat history so it isn't recorded twice */
  recorded?: string;
  changed?: ChangedResource[];
}

class ToolInputError extends Error {}

const num = (v: unknown, field: string, { int = false, max = 100_000_000 } = {}) => {
  const n = typeof v === "string" ? Number(v.replace(/[₦,\s]/g, "")) : Number(v);
  if (!Number.isFinite(n) || n <= 0 || n > max || (int && !Number.isInteger(n))) throw new ToolInputError(`${field} must be a positive ${int ? "whole " : ""}number.`);
  return n;
};
const str = (v: unknown, field: string) => {
  if (typeof v !== "string" || !v.trim()) throw new ToolInputError(`${field} is required.`);
  return v.trim().slice(0, 120);
};

/** Resolve what the owner called a product to exactly one product of this business. */
async function findProduct(biz: CurrentBusiness, name: string) {
  const db = getDb();
  const cols = { id: products.id, name: products.name, unit: products.unit, unitPlural: products.unitPlural, costKobo: products.costKobo, stockUnits: products.stockUnits };
  const exact = await db.select(cols).from(products).where(and(eq(products.businessId, biz.id), sql`lower(${products.name}) = lower(${name})`)).limit(1);
  if (exact[0]) return exact[0];
  const words = name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  const candidates = words.length
    ? await db
        .select(cols)
        .from(products)
        .where(and(eq(products.businessId, biz.id), ...words.map((w) => ilike(products.name, `%${w}%`))))
        .limit(5)
    : [];
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    throw new ToolInputError(`"${name}" matches several products: ${candidates.map((c) => c.name).join(", ")}. Ask the owner which one.`);
  }
  throw new ToolInputError(`There's no product called "${name}" in this shop's product list. Ask the owner to check the name; new products can't be added from chat yet.`);
}

const units = (n: number, p: { unit: string; unitPlural: string }) => `${n} ${n === 1 ? p.unit : p.unitPlural}`;

async function recordSale(biz: CurrentBusiness, args: Record<string, unknown>): Promise<ToolResult> {
  const qty = num(args.quantity, "quantity", { int: true, max: 100_000 });
  const total = num(args.total_amount, "total_amount");
  const p = await findProduct(biz, str(args.product, "product"));
  const newStock = Math.max(0, p.stockUnits - qty);
  const db = getDb();
  await db.batch([
    db.insert(sales).values({
      businessId: biz.id,
      productId: p.id,
      productName: p.name,
      qty,
      amountKobo: toKobo(total),
      costKobo: p.costKobo * qty,
    }),
    db.update(products).set({ stockUnits: sql`greatest(${products.stockUnits} - ${qty}, 0)` }).where(eq(products.id, p.id)),
  ]);
  const recorded = `Sale: ${units(qty, p)} of ${p.name} for ${formatNaira(total)}`;
  const stockNote = p.stockUnits < qty ? ` Note: only ${units(p.stockUnits, p)} were in stock, so stock is now 0 — the owner may need to restock or correct the count.` : "";
  return { content: `Recorded. ${recorded}. Stock now ${units(newStock, p)}.${stockNote}`, recorded, changed: ["sales", "products"] };
}

async function recordExpense(biz: CurrentBusiness, args: Record<string, unknown>): Promise<ToolResult> {
  const amount = num(args.amount, "amount");
  const description = str(args.description, "description");
  const rawCategory = typeof args.category === "string" ? args.category : "Other";
  const category = EXPENSE_CATEGORIES.find((c) => c.toLowerCase() === rawCategory.toLowerCase()) ?? "Other";
  await getDb().insert(expenses).values({ businessId: biz.id, description, category, amountKobo: toKobo(amount) });
  const recorded = `Expense: ${description} (${category}) ${formatNaira(amount)}`;
  return { content: `Recorded. ${recorded}.`, recorded, changed: ["expenses"] };
}

async function recordRestock(biz: CurrentBusiness, args: Record<string, unknown>): Promise<ToolResult> {
  const qty = num(args.quantity, "quantity", { int: true, max: 100_000 });
  const p = await findProduct(biz, str(args.product, "product"));
  const unitCostKobo = args.unit_cost === undefined || args.unit_cost === null ? p.costKobo : toKobo(num(args.unit_cost, "unit_cost"));
  const db = getDb();
  await db.batch([
    db.insert(purchases).values({ businessId: biz.id, productId: p.id, qty, unitCostKobo }),
    // latest purchase price becomes the cost price used for profit
    db.update(products).set({ stockUnits: sql`${products.stockUnits} + ${qty}`, costKobo: unitCostKobo }).where(eq(products.id, p.id)),
  ]);
  const recorded = `Restock: ${units(qty, p)} of ${p.name} at ${formatNaira(unitCostKobo / 100)} each`;
  return { content: `Recorded. ${recorded}. Stock now ${units(p.stockUnits + qty, p)}.`, recorded, changed: ["products"] };
}

const handlers: Record<string, (biz: CurrentBusiness, args: Record<string, unknown>) => Promise<ToolResult>> = {
  record_sale: recordSale,
  record_expense: recordExpense,
  record_restock: recordRestock,
};

export async function runTool(biz: CurrentBusiness, name: string, rawArgs: string): Promise<ToolResult> {
  const handler = handlers[name];
  if (!handler) return { content: `Error: unknown tool ${name}.` };
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
  } catch {
    return { content: "Error: tool arguments were not valid JSON." };
  }
  try {
    return await handler(biz, args);
  } catch (err) {
    if (err instanceof ToolInputError) return { content: `Not recorded: ${err.message}` };
    console.error(`tool ${name} failed`, err);
    return { content: "Not recorded: a database error occurred. Tell the owner it wasn't saved and to try again." };
  }
}
