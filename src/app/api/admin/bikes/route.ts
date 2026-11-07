import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bikes } from "@/db/schema";
import { getAdminUserFromRequest } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { bikeSchema } from "@/lib/schemas";

export async function GET(req: Request) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const list = await db.select().from(bikes).orderBy(asc(bikes.sortOrder));
    return NextResponse.json({ bikes: list });
  } catch (e) {
    console.error("[admin/bikes] list failed:", e);
    return NextResponse.json({ error: "Could not load the fleet." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = bikeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid bike data." }, { status: 422 });

  const slug = `${slugify(parsed.data.name) || "ride"}-${Math.random().toString(36).slice(2, 7)}`;
  try {
    const [{ id }] = await db
      .insert(bikes)
      .values({ ...parsed.data, slug, updatedAt: new Date() })
      .$returningId();
    const [bike] = await db.select().from(bikes).where(eq(bikes.id, id)).limit(1);
    return NextResponse.json({ bike }, { status: 201 });
  } catch (e) {
    console.error("[admin/bikes] create failed:", e);
    return NextResponse.json({ error: "Could not add the ride." }, { status: 500 });
  }
}
