import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { getAdminUserFromRequest, hashPassword, verifyPassword } from "@/lib/auth";
import { rateLimit, rateLimitHeaders, requestIp } from "@/lib/rate-limit";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(100)
      .regex(/[a-zA-Z]/, "Include at least one letter.")
      .regex(/[0-9]/, "Include at least one digit."),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must differ from the current one.",
    path: ["newPassword"],
  });

export async function POST(req: Request) {
  const limiter = rateLimit(`admin-password:${requestIp(req)}`, 8, 15 * 60_000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait 15 minutes." },
      { status: 429, headers: rateLimitHeaders(limiter) },
    );
  }

  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password payload." },
      { status: 422 },
    );
  }

  if (!verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  try {
    // Rotate the hash, then revoke every OTHER session (keep this one so the
    // user isn't force-logged-out mid-action).
    await db
      .update(adminUsers)
      .set({ passwordHash: hashPassword(parsed.data.newPassword) })
      .where(eq(adminUsers.id, user.id));

    const currentToken =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || req.headers.get("x-admin-token") || "";
    if (currentToken) {
      await db
        .delete(adminSessions)
        .where(and(eq(adminSessions.userId, user.id), ne(adminSessions.token, currentToken)));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/password] change failed:", e);
    return NextResponse.json({ error: "Could not change the password." }, { status: 500 });
  }
}
