import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { BankResponse } from "../../src/data/types.js";
import type { CurrentBusiness } from "../business.js";
import { getDb, schema } from "../db/client.js";
import { HttpError } from "../http.js";
import { toNaira } from "../money.js";

const { bankAccounts, bankTransactions } = schema;

async function getAccount(biz: CurrentBusiness) {
  const [account] = await getDb()
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.businessId, biz.id))
    .orderBy(asc(bankAccounts.createdAt))
    .limit(1);
  return account ?? null;
}

export async function getBank(biz: CurrentBusiness): Promise<BankResponse> {
  const account = await getAccount(biz);
  if (!account) return { account: null, transactions: [] };
  const rows = await getDb()
    .select()
    .from(bankTransactions)
    .where(eq(bankTransactions.accountId, account.id))
    .orderBy(desc(bankTransactions.occurredAt))
    .limit(50);
  return {
    account: { bankName: account.bankName, accountTail: account.accountTail },
    transactions: rows.map((t) => ({
      id: t.id,
      occurredAt: t.occurredAt.toISOString(),
      amount: toNaira(t.amountKobo),
      description: t.description,
      status: t.status,
      matchedTo: t.matchedTo,
    })),
  };
}

/** Owner confirmed a match. Nothing is ever reconciled without this explicit call. */
export async function reconcileTransaction(biz: CurrentBusiness, transactionId: string): Promise<void> {
  const account = await getAccount(biz);
  if (!account) throw new HttpError(404, "No bank account connected.");
  const updated = await getDb()
    .update(bankTransactions)
    .set({ status: "matched", matchedTo: sql`coalesce(${bankTransactions.matchedTo}, 'Confirmed by you')` })
    .where(and(eq(bankTransactions.id, transactionId), eq(bankTransactions.accountId, account.id)))
    .returning({ id: bankTransactions.id });
  if (updated.length === 0) throw new HttpError(404, "Transaction not found.");
}
