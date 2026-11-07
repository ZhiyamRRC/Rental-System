import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { rateLimit, rateLimitHeaders, recordLimitSuccess, requestIp } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Login throttling by IP AND by account, but only FAILED attempts consume
 * allowance (a legitimately typed password is refunded). A shared proxy/NAT
 * IP therefore can't lock out a real admin, and credential-stuffing on the
 * account is still capped.
 */
export async function POST(req: Request) {
  const ipKey = `admin-login:ip:${requestIp(req)}`;

  // peek body early to build the account key without consuming twice
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 422 });
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 422 });
  }

  const email = parsed.data.email.toLowerCase();
  const acctKey = `admin-login:acct:${email}`;

  const ipLimit = rateLimit(ipKey, 30, 15 * 60_000);   // generous per shared IP
  const acctLimit = rateLimit(acctKey, 8, 15 * 60_000); // strict per account
  if (!ipLimit.ok || !acctLimit.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a few minutes and try again.", locked: true },
      { status: 429, headers: rateLimitHeaders(acctLimit) },
    );
  }

  try {
    // Self-heal: guarantee schema + admin account exist even on a fresh/reset DB.
    await ensureDatabase();

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);

    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }

    // correct password → refund both buckets so a clean login never counts against the limits
    recordLimitSuccess(ipKey);
    recordLimitSuccess(acctKey);

    const token = await createSession(user.id);
    return NextResponse.json({ ok: true, token });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Login failed — try again." }, { status: 500 });
  }
}
