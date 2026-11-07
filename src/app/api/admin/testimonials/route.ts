import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { getAdminUserFromRequest } from "@/lib/auth";
import { testimonialSchema } from "@/lib/schemas";

export async function GET(req: Request) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const list = await db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
    return NextResponse.json({ testimonials: list });
  } catch (e) {
    console.error("[admin/reviews] list failed:", e);
    return NextResponse.json({ error: "Could not load reviews." }, { status: 500 });
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
  const parsed = testimonialSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid review data." }, { status: 422 });

  try {
    const [{ id }] = await db.insert(testimonials).values(parsed.data).$returningId();
    const [testimonial] = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (e) {
    console.error("[admin/reviews] create failed:", e);
    return NextResponse.json({ error: "Could not create the review." }, { status: 500 });
  }
}
