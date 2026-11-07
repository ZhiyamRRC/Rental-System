import { NextResponse } from "next/server";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bikes, bookings } from "@/db/schema";
import { daysBetween, makeReference, todayIso } from "@/lib/utils";
import { rateLimit, rateLimitHeaders, requestIp } from "@/lib/rate-limit";
import { isValidCountry } from "@/lib/countries";
import { notifyAdminOfBooking } from "@/lib/whatsapp";

const bookingSchema = z.object({
  bikeId: z.number().int().positive(),
  customerName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(5).max(40),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pickupLocation: z.string().trim().min(2).max(120).default("Nuwara Eliya Town (HQ)"),
  licenseCountry: z.string().trim().max(80).default(""),
  partySize: z.number().int().min(1).max(10).default(1),
  message: z.string().trim().max(1000).default(""),
});

type Outcome =
  | { ok: true; reference: string }
  | { ok: false; status: number; error: string };

export async function POST(req: Request) {
  const limiter = rateLimit(`booking:${requestIp(req)}`, 12, 60 * 60_000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again later or contact us on WhatsApp." },
      { status: 429, headers: rateLimitHeaders(limiter) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your details — some fields are missing or invalid." },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // Country must come from the shared ISO list (the form is a dropdown; this
  // guards direct API calls). Empty stays allowed for backwards compatibility.
  if (data.licenseCountry && !isValidCountry(data.licenseCountry)) {
    return NextResponse.json({ error: "Select a valid licence country." }, { status: 422 });
  }

  if (data.pickupDate < todayIso()) {
    return NextResponse.json({ error: "Pickup date cannot be in the past." }, { status: 422 });
  }

  const days = daysBetween(data.pickupDate, data.returnDate);
  if (days < 1) {
    return NextResponse.json({ error: "Return date must be after the pickup date." }, { status: 422 });
  }
  if (days > 90) {
    return NextResponse.json({ error: "For rentals over 90 days, please contact us directly." }, { status: 422 });
  }

  try {
    const outcome = await db.transaction<Outcome>(async (tx) => {
      // Row-lock the bike record for the duration of the transaction, so two
      // concurrent requests cannot both pass the overlap check (MySQL: FOR UPDATE).
      await tx.execute(sql`select id from bikes where id = ${data.bikeId} for update`);

      const [bike] = await tx.select().from(bikes).where(eq(bikes.id, data.bikeId)).limit(1);
      if (!bike || bike.status === "retired") {
        return { ok: false, status: 404, error: "This ride is no longer available." };
      }
      if (bike.status === "maintenance") {
        return {
          ok: false,
          status: 409,
          error: "This ride is in the workshop right now — pick another one from the fleet.",
        };
      }

      const conflicts = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.bikeId, bike.id),
            inArray(bookings.status, ["confirmed", "active"]),
            lte(bookings.pickupDate, data.returnDate),
            gte(bookings.returnDate, data.pickupDate),
          ),
        )
        .limit(1);

      if (conflicts.length > 0) {
        return {
          ok: false,
          status: 409,
          error: "Those dates are already taken for this ride — try shifting your window a day or two.",
        };
      }

      const reference = makeReference();
      await tx.insert(bookings).values({
        reference,
        bikeId: bike.id,
        customerName: data.customerName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        pickupDate: data.pickupDate,
        returnDate: data.returnDate,
        pickupLocation: data.pickupLocation,
        licenseCountry: data.licenseCountry,
        partySize: data.partySize,
        message: data.message,
        totalDays: days,
        totalPrice: days * bike.pricePerDay,
        status: "pending",
      });

      return { ok: true, reference };
    });

    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }

    // The booking is already committed. WhatsApp is intentionally non-fatal:
    // if Meta is down/misconfigured, the booking still succeeds and Admin can
    // retry from Bookings. Await it here because shared hosting cannot safely
    // run background jobs after the response has ended.
    let whatsappStatus: "sent" | "failed" | "not_configured" = "failed";
    let whatsappFallbackUrl = "";
    try {
      const notification = await notifyAdminOfBooking(outcome.reference);
      whatsappStatus = notification.status;
      whatsappFallbackUrl = notification.fallbackUrl;
    } catch (notificationError) {
      console.error(`[bookings] WhatsApp notification failed for ${outcome.reference}:`, notificationError);
    }

    return NextResponse.json(
      {
        reference: outcome.reference,
        whatsappStatus,
        // Lets the confirmation flow offer a one-tap manual fallback if the
        // Cloud API is not configured or temporarily failed.
        whatsappFallbackUrl,
      },
      { status: 201, headers: rateLimitHeaders(limiter) },
    );
  } catch (e) {
    console.error("[bookings] create failed:", e);
    return NextResponse.json(
      { error: "Could not create the booking. Please try again or contact us on WhatsApp." },
      { status: 500 },
    );
  }
}
