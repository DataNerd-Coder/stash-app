import { eq } from "drizzle-orm";
import type { Business, BusinessUpdate } from "../../src/data/types.js";
import type { CurrentBusiness } from "../business.js";
import { getDb, schema } from "../db/client.js";
import { HttpError } from "../http.js";

const { businesses } = schema;

export async function getProfile(biz: CurrentBusiness): Promise<Business> {
  const [b] = await getDb().select().from(businesses).where(eq(businesses.id, biz.id));
  return { name: b.name, ownerFirstName: b.ownerFirstName, ownerLastName: b.ownerLastName, phone: b.phone, email: b.email };
}

const clean = (v: unknown, field: string, max: number) => {
  if (typeof v !== "string" || !v.trim()) throw new HttpError(400, `${field} is required.`);
  const s = v.trim();
  if (s.length > max) throw new HttpError(400, `${field} is too long.`);
  return s;
};

export async function updateProfile(biz: CurrentBusiness, input: Partial<BusinessUpdate>): Promise<Business> {
  const ownerName = clean(input.ownerName, "Your name", 80);
  const [first, ...rest] = ownerName.split(/\s+/);
  await getDb()
    .update(businesses)
    .set({
      name: clean(input.businessName, "Business name", 80),
      ownerFirstName: first,
      ownerLastName: rest.join(" "),
      phone: clean(input.phone, "Phone number", 30),
    })
    .where(eq(businesses.id, biz.id));
  return getProfile(biz);
}
