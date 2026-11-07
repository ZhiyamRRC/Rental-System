import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bikes, bookings } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { BookingsManager, type AdminBooking } from "@/components/admin/bookings-manager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bookings · Garage Control" };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, token, viaUrl } = await requireAdmin(await searchParams);

  let initial: AdminBooking[] = [];
  try {
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
    initial = rows.map((r) => ({ ...r, bikeName: r.bikeName ?? "—" }));
  } catch (e) {
    console.error("bookings SSR fetch failed (client will retry):", e);
  }

  return (
    <AdminChrome userName={user.name} token={token} viaUrl={viaUrl}>
      <BookingsManager initial={initial} />
    </AdminChrome>
  );
}
