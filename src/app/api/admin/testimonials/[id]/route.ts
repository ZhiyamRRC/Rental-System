import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { getAdminUserFromRequest } from "@/lib/auth";
import { testimonialSchema } from "@/lib/schemas";

function numericId(raw: string) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = numericId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid review ID." }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = testimonialSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid review data." }, { status: 422 });

  try {
    const result = await db.update(testimonials).set(parsed.data).where(eq(testimonials.id, id));
    if (result[0].affectedRows === 0) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    const [testimonial] = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
    return NextResponse.json({ testimonial });
  } catch (e) {
    console.error("[admin/reviews] update failed:", e);
    return NextResponse.json({ error: "Could not update the review." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = numericId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid review ID." }, { status: 400 });

  try {
    const result = await db.delete(testimonials).where(eq(testimonials.id, id));
    if (result[0].affectedRows === 0) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/reviews] delete failed:", e);
    return NextResponse.json({ error: "Could not delete the review." }, { status: 500 });
  }
}
