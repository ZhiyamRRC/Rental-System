import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST(req: Request) {
  await destroySession(req);
  return NextResponse.json({ ok: true });
}
