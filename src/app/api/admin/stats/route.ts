import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth";
import { computeAdminStats } from "@/lib/admin-stats";

export async function GET(req: Request) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await computeAdminStats());
  } catch (e) {
    console.error("[admin/stats] failed:", e);
    return NextResponse.json({ error: "Stats unavailable" }, { status: 500 });
  }
}
