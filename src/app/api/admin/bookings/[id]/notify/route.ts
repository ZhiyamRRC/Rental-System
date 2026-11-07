import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { getAdminUserFromRequest } from "@/lib/auth";
import { notifyAdminOfBooking, notifyCustomerOfDecision, type BookingDecision } from "@/lib/whatsapp";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const bodySchema = z
  .object({
    /** "admin" resends the new-booking alert; "customer" resends confirm/decline. */
    target: z.enum(["admin", "customer"]).default("admin"),
    decision: z.enum(["confirmed", "cancelled"]).optional(),
  })
  .default({ target: "admin" });

function numericId(raw: string) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = numericId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid booking ID." }, { status: 400 });

  let raw: unknown = {};
  try {
    const text = await req.text();
    raw = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid notification request." }, { status: 422 });
  const target = parsed.data.target;

  // Prevent an accidental double-click from spamming WhatsApp.
  const limiter = rateLimit(`booking-whatsapp:${target}:${id}`, 3, 5 * 60_000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many retries for this booking. Wait five minutes." },
      { status: 429, headers: rateLimitHeaders(limiter) },
    );
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  try {
    let notification;
    if (target === "customer") {
      // Use the explicit decision, else infer from the booking's current status.
      const decision: BookingDecision | null =
        parsed.data.decision ??
        (booking.status === "confirmed" ? "confirmed" : booking.status === "cancelled" ? "cancelled" : null);
      if (!decision) {
        return NextResponse.json(
          { error: "Set the booking to Confirmed or Cancelled before messaging the customer." },
          { status: 409 },
        );
      }
      notification = await notifyCustomerOfDecision(booking.reference, decision);
    } else {
      notification = await notifyAdminOfBooking(booking.reference);
    }

    const status = notification.status === "sent" ? 200 : notification.status === "not_configured" ? 503 : 502;
    return NextResponse.json(
      {
        ok: notification.status === "sent",
        target,
        whatsappStatus: notification.status,
        messageId: notification.messageId,
        recipient: notification.recipient,
        error: notification.error,
        fallbackUrl: notification.fallbackUrl,
      },
      { status, headers: rateLimitHeaders(limiter) },
    );
  } catch (error) {
    console.error(`[admin/bookings/${id}/notify] failed:`, error);
    return NextResponse.json({ error: "Could not send the WhatsApp notification." }, { status: 500 });
  }
}
