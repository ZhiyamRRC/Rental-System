import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bikes, bookings } from "@/db/schema";
import { getAdminUserFromRequest } from "@/lib/auth";
import { bikeSchema } from "@/lib/schemas";

function numericId(raw: string) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = numericId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid bike ID." }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = bikeSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid bike data." }, { status: 422 });

  try {
    const result = await db
      .update(bikes)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(bikes.id, id));
    if (result[0].affectedRows === 0) return NextResponse.json({ error: "Ride not found." }, { status: 404 });
    const [bike] = await db.select().from(bikes).where(eq(bikes.id, id)).limit(1);
    return NextResponse.json({ bike });
  } catch (e) {
    console.error("[admin/bikes] update failed:", e);
    return NextResponse.json({ error: "Could not update the ride." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = numericId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid bike ID." }, { status: 400 });

  try {
    const history = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.bikeId, id)).limit(1);
    if (history.length > 0) {
      return NextResponse.json(
        { error: "This ride has booking history and cannot be deleted. Set its status to Retired instead." },
        { status: 409 },
      );
    }
    const result = await db.delete(bikes).where(eq(bikes.id, id));
    if (result[0].affectedRows === 0) return NextResponse.json({ error: "Ride not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/bikes] delete failed:", e);
    return NextResponse.json({ error: "Could not delete the ride." }, { status: 500 });
  }
}
