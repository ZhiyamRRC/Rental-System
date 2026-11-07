import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";

export async function GET(req: Request) {
  try {
    await ensureDatabase();
  } catch (e) {
    console.error("ensureDatabase failed:", e);
  }
  const user = await getAdminUserFromRequest(req);
  if (!user) {
    console.warn(
      `[admin/me] 401 — cookie:${req.headers.get("cookie") ? "yes" : "no"} bearer:${req.headers.get("authorization") ? "yes" : "no"} x-token:${req.headers.get("x-admin-token") ? "yes" : "no"}`,
    );
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
