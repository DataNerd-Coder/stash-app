// Phone + password auth with database sessions. Uses only node:crypto, so it
// runs on Vercel's Node runtime with no extra services.
//
// - Passwords: scrypt with a random salt, compared in constant time.
// - Sessions: a random 32-byte token in an HttpOnly cookie; the database only
//   stores its sha256, so a leaked sessions table can't be used to log in.
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type BinaryLike, type ScryptOptions } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db/client.js";
import { HttpError } from "./http.js";

const COOKIE = "stash_session";
const SESSION_DAYS = 30;
const KEY_LEN = 64;

const scrypt = (password: BinaryLike, salt: BinaryLike, keylen: number, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => scryptCb(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))));
const SCRYPT_OPTS: ScryptOptions = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LEN, SCRYPT_OPTS);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length, SCRYPT_OPTS);
  return timingSafeEqual(actual, expected);
}

/** "+234 803 123 4567", "2348031234567", "0803-123-4567" -> "08031234567" */
export function normalizePhone(input: unknown): string {
  if (typeof input !== "string") throw new HttpError(400, "Phone number is required.");
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("234")) digits = `0${digits.slice(3)}`;
  if (!/^0\d{10}$/.test(digits)) throw new HttpError(400, "Enter a valid Nigerian phone number, e.g. 0803 123 4567.");
  return digits;
}

export function validatePassword(input: unknown): string {
  if (typeof input !== "string" || input.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");
  if (input.length > 200) throw new HttpError(400, "Password is too long.");
  return input;
}

const tokenId = (token: string) => createHash("sha256").update(token).digest("hex");

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function cookie(request: Request, value: string, maxAgeSeconds: number): string {
  // Secure everywhere except plain-http localhost during development
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

/** Creates a session for the user and returns the Set-Cookie header value. */
export async function startSession(request: Request, userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await getDb()
    .insert(schema.sessions)
    .values({ id: tokenId(token), userId, expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) });
  return cookie(request, token, SESSION_DAYS * 86_400);
}

/** Deletes the current session (if any) and returns a Set-Cookie that clears it. */
export async function endSession(request: Request): Promise<string> {
  const token = readCookie(request, COOKIE);
  if (token) await getDb().delete(schema.sessions).where(eq(schema.sessions.id, tokenId(token)));
  return cookie(request, "", 0);
}

export interface SessionUser {
  userId: string;
  name: string;
  phone: string;
  businessId: string;
  timezone: string;
}

/** The signed-in user, or null. Expired sessions are cleaned up on sight. */
export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const token = readCookie(request, COOKIE);
  if (!token) return null;
  const id = tokenId(token);
  const db = getDb();
  const [row] = await db
    .select({
      userId: schema.users.id,
      name: schema.users.name,
      phone: schema.users.phone,
      businessId: schema.users.businessId,
      timezone: schema.businesses.timezone,
      expiresAt: schema.sessions.expiresAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .innerJoin(schema.businesses, eq(schema.businesses.id, schema.users.businessId))
    .where(eq(schema.sessions.id, id))
    .limit(1);
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
    return null;
  }
  const { expiresAt: _expiresAt, ...user } = row;
  return user;
}

export async function requireUser(request: Request): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) throw new HttpError(401, "Please log in to continue.");
  return user;
}
