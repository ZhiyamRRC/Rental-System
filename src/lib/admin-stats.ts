import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bikes, bookings, testimonials } from "@/db/schema";
import { todayIso } from "@/lib/utils";

export type AdminStats = {
  revenue: number;
  pending: number;
  activeNow: number;
  totalBookings: number;
  pendingReviews: number;
  fleetTotal: number;
  fleetAvailable: number;
  series: { day: string; revenue: number; count: number }[];
  statusDist: { name: string; value: number; color: string }[];
  recent: {
    id: number;
    reference: string;
    customerName: string;
    bikeName: string;
    pickupDate: string;
    returnDate: string;
    totalPrice: number;
    status: string;
  }[];
};

/** Single source of truth for dashboard stats — used by the page (SSR) and the API (refresh). */
export async function computeAdminStats(): Promise<AdminStats> {
  const [allBookings, fleet, pendingReviews] = await Promise.all([
    db
      .select({
        id: bookings.id,
        reference: bookings.reference,
        customerName: bookings.customerName,
        pickupDate: bookings.pickupDate,
        returnDate: bookings.returnDate,
        totalDays: bookings.totalDays,
        totalPrice: bookings.totalPrice,
        status: bookings.status,
        createdAt: bookings.createdAt,
        bikeName: bikes.name,
      })
      .from(bookings)
      .leftJoin(bikes, eq(bookings.bikeId, bikes.id)),
    db.select().from(bikes),
    db.select({ id: testimonials.id }).from(testimonials).where(eq(testimonials.approved, false)),
  ]);

  const today = todayIso();
  const moneyStatuses = new Set(["confirmed", "active", "completed"]);
  const revenue = allBookings
    .filter((b) => moneyStatuses.has(b.status))
    .reduce((s, b) => s + b.totalPrice, 0);
  const pending = allBookings.filter((b) => b.status === "pending").length;
  const activeNow = allBookings.filter(
    (b) => ["confirmed", "active"].includes(b.status) && b.pickupDate <= today && b.returnDate >= today,
  ).length;

  const series: AdminStats["series"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const dayBookings = allBookings.filter((b) => b.createdAt.toISOString().slice(0, 10) === iso);
    series.push({
      day: d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
      revenue: dayBookings.filter((b) => moneyStatuses.has(b.status)).reduce((s, b) => s + b.totalPrice, 0),
      count: dayBookings.length,
    });
  }

  const statusColors: Record<string, string> = {
    pending: "#ffb01f",
    confirmed: "#2fd4ae",
    active: "#ff4d12",
    completed: "#8b94a0",
    cancelled: "#5a3333",
  };
  const statusDist = Object.entries(
    allBookings.reduce<Record<string, number>>((acc, b) => {
      acc[b.status] = (acc[b.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value, color: statusColors[name] ?? "#8b94a0" }));

  const recent = [...allBookings]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 7)
    .map((b) => ({
      id: b.id,
      reference: b.reference,
      customerName: b.customerName,
      bikeName: b.bikeName ?? "—",
      pickupDate: b.pickupDate,
      returnDate: b.returnDate,
      totalPrice: b.totalPrice,
      status: b.status,
    }));

  return {
    revenue,
    pending,
    activeNow,
    totalBookings: allBookings.length,
    pendingReviews: pendingReviews.length,
    fleetTotal: fleet.length,
    fleetAvailable: fleet.filter((b) => b.status === "available").length,
    series,
    statusDist,
    recent,
  };
}
