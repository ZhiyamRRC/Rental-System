import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { getAdminUserFromRequest } from "@/lib/auth";
import { notifyCustomerOfDecision, type BookingDecision } from "@/lib/whatsapp";

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "active", "completed", "cancelled"]),
  /** Admin can opt out of messaging the customer for a silent correction. */
  notifyCustomer: z.boolean().optional(),
});

function numericId(raw: string) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = numericId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid booking ID." }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 422 });

  try {
    const [existing] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    await db
      .update(bookings)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(bookings.id, id));

    // Confirm/decline → tell the customer on their own WhatsApp number.
    // Only when the status actually changed, so re-saving the same value or
    // flipping other statuses never spams them. Never fatal to the update.
    const decision: BookingDecision | null =
      parsed.data.status === "confirmed" ? "confirmed" : parsed.data.status === "cancelled" ? "cancelled" : null;
    const statusChanged = existing.status !== parsed.data.status;
    const shouldNotify = decision !== null && statusChanged && parsed.data.notifyCustomer !== false;

    let customerWhatsappStatus: string | null = null;
    let customerWhatsappFallbackUrl = "";
    if (shouldNotify && decision) {
      try {
        const notification = await notifyCustomerOfDecision(existing.reference, decision);
        customerWhatsappStatus = notification.status;
        customerWhatsappFallbackUrl = notification.fallbackUrl;
      } catch (notifyError) {
        console.error(`[admin/bookings/${id}] customer WhatsApp failed:`, notifyError);
        customerWhatsappStatus = "failed";
      }
    }

    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return NextResponse.json({ booking, customerWhatsappStatus, customerWhatsappFallbackUrl });
  } catch (e) {
    console.error("[admin/bookings] update failed:", e);
    return NextResponse.json({ error: "Could not update the booking." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = numericId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid booking ID." }, { status: 400 });

  try {
    const result = await db.delete(bookings).where(eq(bookings.id, id));
    if (result[0].affectedRows === 0) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/bookings] delete failed:", e);
    return NextResponse.json({ error: "Could not delete the booking." }, { status: 500 });
  }
}
