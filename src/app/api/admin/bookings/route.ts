import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bikes, bookings } from "@/db/schema";
import { getAdminUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      customerName: bookings.customerName,
      email: bookings.email,
      phone: bookings.phone,
      pickupDate: bookings.pickupDate,
      returnDate: bookings.returnDate,
      pickupLocation: bookings.pickupLocation,
      licenseCountry: bookings.licenseCountry,
      partySize: bookings.partySize,
      message: bookings.message,
      totalDays: bookings.totalDays,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      whatsappStatus: bookings.whatsappStatus,
      whatsappMessageId: bookings.whatsappMessageId,
      whatsappError: bookings.whatsappError,
      whatsappSentAt: bookings.whatsappSentAt,
      customerWhatsappStatus: bookings.customerWhatsappStatus,
      customerWhatsappMessageId: bookings.customerWhatsappMessageId,
      customerWhatsappError: bookings.customerWhatsappError,
      customerNotifiedDecision: bookings.customerNotifiedDecision,
      bikeName: bikes.name,
    })
    .from(bookings)
    .leftJoin(bikes, eq(bookings.bikeId, bikes.id))
    .orderBy(desc(bookings.createdAt));

  return NextResponse.json({
    bookings: rows.map((r) => ({ ...r, bikeName: r.bikeName ?? "—" })),
  });
}
