import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { adminSessions, adminUsers, type AdminUser } from "@/db/schema";
import { and, eq, gt, lt } from "drizzle-orm";

const COOKIE_NAME = "cr_admin";
const SESSION_DAYS = 7;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  // Prevent unbounded session-table growth.
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  await db.insert(adminSessions).values({ token, userId, expiresAt });
  try {
    const store = await cookies();
    const isProd = process.env.NODE_ENV === "production";
    store.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      path: "/",
      expires: expiresAt,
    });
  } catch {
    // cookie may be blocked in embedded previews — Bearer auth covers that
  }
  return token;
}

export async function destroySession(req?: Request) {
  let token: string | undefined;
  try {
    const store = await cookies();
    token = store.get(COOKIE_NAME)?.value;
    store.delete(COOKIE_NAME);
  } catch {
    /* cookies unavailable */
  }
  if (!token && req) {
    const auth = req.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) token = auth.slice(7).trim();
    if (!token) token = req.headers.get("x-admin-token")?.trim();
  }
  if (token) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
  }
}

export async function getAdminUserByToken(token: string | undefined | null): Promise<AdminUser | null> {
  if (!token) return null;
  try {
    const rows = await db
      .select({ user: adminUsers })
      .from(adminSessions)
      .innerJoin(adminUsers, eq(adminSessions.userId, adminUsers.id))
      .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, new Date())))
      .limit(1);
    return rows[0]?.user ?? null;
  } catch {
    return null;
  }
}

export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const store = await cookies();
    return getAdminUserByToken(store.get(COOKIE_NAME)?.value);
  } catch {
    return null;
  }
}

/** Auth for API routes: cookie → Authorization: Bearer → x-admin-token. */
export async function getAdminUserFromRequest(req: Request): Promise<AdminUser | null> {
  const user = await getAdminUser();
  if (user) return user;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const fromAuth = await getAdminUserByToken(auth.slice(7).trim());
    if (fromAuth) return fromAuth;
  }
  const alt = req.headers.get("x-admin-token");
  if (alt) return getAdminUserByToken(alt.trim());
  return null;
}
