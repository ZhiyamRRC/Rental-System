import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  KeyRound,
  MapPin,
  MessageCircle,
  PhoneCall,
  Users,
} from "lucide-react";
import { db } from "@/db";
import { bikes, bookings } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { formatDate, formatUsd, statusLabel } from "@/lib/utils";
import { Reveal } from "@/components/site/reveal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Booking confirmed" };

const statusStyles: Record<string, string> = {
  pending: "bg-amber/15 text-amber border-amber/40",
  confirmed: "bg-seafoam/15 text-seafoam border-seafoam/40",
  active: "bg-seafoam/15 text-seafoam border-seafoam/40",
  completed: "bg-mist/10 text-mist/70 border-line",
  cancelled: "bg-ember/10 text-ember border-ember/40",
};

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const rows = await db
    .select({ booking: bookings, bike: bikes })
    .from(bookings)
    .innerJoin(bikes, eq(bookings.bikeId, bikes.id))
    .where(eq(bookings.reference, ref.toUpperCase()))
    .limit(1);
  if (rows.length === 0) notFound();
  const { booking, bike } = rows[0];
  const settings = await getSettings();

  const nextSteps = [
    {
      icon: MessageCircle,
      title: booking.whatsappStatus === "sent" ? "Admin notified on WhatsApp" : "Confirm on WhatsApp",
      desc:
        booking.whatsappStatus === "sent"
          ? "Your full booking details have already reached our admin WhatsApp. The crew will reply shortly."
          : "Your booking is saved. Tap the WhatsApp button below to send the details directly while we confirm your pickup.",
    },
    {
      icon: CircleCheck,
      title: "Send your license",
      desc: "Reply with a photo of your license + IDP so we can start the permit endorsement.",
    },
    {
      icon: KeyRound,
      title: "Collect the keys",
      desc: `Show up at ${booking.pickupLocation}, do a 5-minute joint inspection, ride out.`,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pt-32 pb-24 sm:px-6">
      <Reveal className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-ember/15 text-ember">
          <CircleCheck className="size-8" />
        </span>
        <p className="mt-5 font-hand text-2xl text-ember">you&apos;re on the list</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-6xl">
          RIDE <span className="text-outline">RESERVED</span>
        </h1>
        <p className="mt-4 text-sm text-smoke">
          Booking reference
        </p>
        <p className="mt-1 inline-block rounded-2xl border border-dashed border-ember/60 bg-ember/10 px-6 py-3 font-display text-3xl font-bold tracking-[0.2em] text-ember">
          {booking.reference}
        </p>
        <p
          className={`mx-auto mt-4 flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium ${
            booking.whatsappStatus === "sent"
              ? "border-seafoam/40 bg-seafoam/10 text-seafoam"
              : "border-amber/40 bg-amber/10 text-amber"
          }`}
        >
          <MessageCircle className="size-4" />
          {booking.whatsappStatus === "sent"
            ? "Booking delivered to the admin WhatsApp"
            : "Booking saved — WhatsApp confirmation is still available below"}
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-12 overflow-hidden rounded-3xl border border-line bg-carbon">
          <div className="grid md:grid-cols-[240px_1fr]">
            <div className="relative min-h-48 bg-parchment">
              <Image src={bike.imageUrl} alt={bike.name} fill className="object-cover" sizes="240px" />
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold">{bike.name}</h2>
                  <p className="font-hand text-xl text-ember">{bike.tagline}</p>
                </div>
                <span
                  className={`rounded-full border px-4 py-1.5 font-display text-[11px] font-bold tracking-[0.18em] uppercase ${statusStyles[booking.status] ?? statusStyles.pending}`}
                >
                  {statusLabel[booking.status] ?? booking.status}
                </span>
              </div>
              <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                <p className="flex items-center gap-2.5 text-mist/80">
                  <CalendarDays className="size-4 text-ember" />
                  {formatDate(booking.pickupDate)} → {formatDate(booking.returnDate)}
                  <span className="text-smoke">({booking.totalDays} days)</span>
                </p>
                <p className="flex items-center gap-2.5 text-mist/80">
                  <MapPin className="size-4 text-ember" />
                  {booking.pickupLocation}
                </p>
                <p className="flex items-center gap-2.5 text-mist/80">
                  <Users className="size-4 text-ember" />
                  {booking.partySize} rider{booking.partySize > 1 ? "s" : ""} · {booking.customerName}
                </p>
                <p className="flex items-center gap-2.5 font-display text-lg font-bold text-ember">
                  <Check className="size-4" />
                  {formatUsd(booking.totalPrice)} trip total
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {nextSteps.map((s, i) => (
          <Reveal key={s.title} delay={0.15 + i * 0.08}>
            <div className="h-full rounded-3xl border border-line bg-carbon p-6">
              <span className="grid size-11 place-items-center rounded-2xl bg-ember/15 text-ember">
                <s.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.35}>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href={`https://wa.me/${settings.contact.whatsapp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
              [
                `Hi Ceylon Ride Co! Here is my booking ${booking.reference}:`,
                `Customer: ${booking.customerName}`,
                `Phone: ${booking.phone}`,
                `Ride: ${bike.name}`,
                `Dates: ${formatDate(booking.pickupDate)} – ${formatDate(booking.returnDate)}`,
                `Pickup: ${booking.pickupLocation}`,
                `Total: ${formatUsd(booking.totalPrice)}`,
              ].join("\n"),
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full bg-ember px-7 py-3.5 font-display text-sm font-bold tracking-wide text-ink uppercase transition-colors hover:bg-amber"
          >
            <MessageCircle className="size-4" /> Confirm on WhatsApp
          </a>
          <a
            href={`tel:${settings.contact.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-2 rounded-full border border-line px-7 py-3.5 font-display text-sm font-bold tracking-wide uppercase transition-colors hover:border-mist/40"
          >
            <PhoneCall className="size-4" /> {settings.contact.phone}
          </a>
          <Link href="/fleet" className="flex items-center gap-2 text-sm text-smoke transition-colors hover:text-ember">
            <Clock className="size-4" /> Browse more rides
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
