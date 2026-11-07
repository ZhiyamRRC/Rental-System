import { and, asc, gte, inArray, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { bikes, bookings } from "@/db/schema";
import { daysBetween, todayIso } from "@/lib/utils";
import { FleetBrowser } from "@/components/fleet/fleet-browser";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Fleet — Scooters, Motorbikes, Tuk-Tuks & SUVs",
  description:
    "Browse every ride in the Ceylon Ride Co. fleet in Nuwara Eliya: scooters from $9/day, motorbikes, self-drive tuk-tuks and family SUVs. Transparent pricing, insurance included.",
};

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "";
  const pickup = typeof params.pickup === "string" ? params.pickup : "";
  const ret = typeof params.return === "string" ? params.return : "";
  const location = typeof params.location === "string" ? params.location : "";

  const trip = pickup && ret && ret > pickup ? { days: daysBetween(pickup, ret), pickup, ret } : null;

  const today = todayIso();
  const [fleet, onTourRows] = await Promise.all([
    db.select().from(bikes).where(ne(bikes.status, "retired")).orderBy(asc(bikes.sortOrder)),
    db
      .select({ bikeId: bookings.bikeId })
      .from(bookings)
      .where(
        and(
          inArray(bookings.status, ["confirmed", "active"]),
          lte(bookings.pickupDate, today),
          gte(bookings.returnDate, today),
        ),
      ),
  ]);

  const onTour = onTourRows.map((r) => r.bikeId);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-36 pb-24 sm:px-6">
      <header className="max-w-2xl">
        <p className="font-hand text-2xl text-ember">every key on the rack</p>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-tight sm:text-7xl">
          THE <span className="text-outline">FLEET</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-smoke sm:text-base">
          Real bikes, real prices, no fine print — collected in Nuwara Eliya town, at Nanu Oya
          station, or delivered to your hotel. Insurance, helmets and unlimited kilometres always included.
        </p>
      </header>

      {trip && (
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-ember/40 bg-ember/10 px-5 py-4 text-sm">
          <span className="font-display text-xs font-bold tracking-[0.18em] text-ember uppercase">
            Your trip
          </span>
          <span className="text-mist/85">
            {trip.pickup} → {trip.ret} · <strong className="text-ember">{trip.days} days</strong>
            {location ? ` · pickup at ${location}` : ""} — trip totals shown on each ride
          </span>
        </div>
      )}

      <FleetBrowser bikes={fleet} initialCategory={category} trip={trip} onTourIds={onTour} />
    </div>
  );
}
