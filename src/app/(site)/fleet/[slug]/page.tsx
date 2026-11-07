import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, ne } from "drizzle-orm";
import { ArrowLeft, Briefcase, Cog, Gauge, ShieldCheck, Users, Wallet } from "lucide-react";
import { db } from "@/db";
import { bikes } from "@/db/schema";
import { categoryLabel, formatUsd, todayIso } from "@/lib/utils";
import { BikeCard } from "@/components/site/bike-card";
import { BookingPanel } from "@/components/booking/booking-panel";
import { Reveal } from "@/components/site/reveal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [bike] = await db.select().from(bikes).where(eq(bikes.slug, slug)).limit(1);
  if (!bike) return { title: "Ride not found" };
  return {
    title: `${bike.name} — ${categoryLabel[bike.category] ?? bike.category} rental from $${bike.pricePerDay}/day`,
    description: bike.description.slice(0, 155),
  };
}

export default async function BikeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const [bike] = await db.select().from(bikes).where(eq(bikes.slug, slug)).limit(1);
  if (!bike || bike.status === "retired") notFound();

  const similar = await db
    .select()
    .from(bikes)
    .where(and(eq(bikes.category, bike.category), ne(bikes.id, bike.id), ne(bikes.status, "retired")))
    .orderBy(asc(bikes.sortOrder))
    .limit(3);

  const queryPickup = typeof sp.pickup === "string" ? sp.pickup : "";
  const queryReturn = typeof sp.return === "string" ? sp.return : "";
  const location = typeof sp.location === "string" ? sp.location : "";
  const pickup = queryPickup || todayIso();
  const pickupDate = new Date(`${pickup}T00:00:00Z`);
  pickupDate.setUTCDate(pickupDate.getUTCDate() + 5);
  const defaultReturn = pickupDate.toISOString().slice(0, 10);
  const ret = queryReturn && queryReturn > pickup ? queryReturn : defaultReturn;

  const specs = [
    { icon: Gauge, label: "Engine", value: `${bike.engineCc}cc` },
    { icon: Cog, label: "Gearbox", value: bike.transmission },
    { icon: Users, label: "Seats", value: String(bike.seats) },
    { icon: Briefcase, label: "Luggage", value: bike.luggage },
    { icon: Wallet, label: "Refundable deposit", value: formatUsd(bike.deposit) },
    { icon: ShieldCheck, label: "Insurance", value: "Fully included" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-32 pb-24 sm:px-6">
      <Link
        href="/fleet"
        className="inline-flex items-center gap-2 font-display text-xs font-bold tracking-[0.18em] text-smoke uppercase transition-colors hover:text-ember"
      >
        <ArrowLeft className="size-4" /> Back to fleet
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        {/* left column */}
        <div>
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-parchment">
              <div className="relative aspect-[4/3]">
                <Image
                  src={bike.imageUrl}
                  alt={bike.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute top-5 left-5 flex gap-2">
                <span className="rounded-full bg-ink/85 px-4 py-1.5 font-display text-[11px] font-bold tracking-[0.18em] text-mist uppercase backdrop-blur">
                  {categoryLabel[bike.category] ?? bike.category}
                </span>
                {bike.status === "maintenance" && (
                  <span className="rounded-full bg-amber px-4 py-1.5 font-display text-[11px] font-bold tracking-[0.18em] text-ink uppercase">
                    In the shop
                  </span>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-8">
              <p className="font-hand text-2xl text-ember">{bike.tagline}</p>
              <h1 className="mt-1 font-display text-4xl font-bold tracking-tight sm:text-6xl">{bike.name}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-mist/70 sm:text-base">
                {bike.description}
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {specs.map((s, i) => (
              <Reveal key={s.label} delay={0.08 + i * 0.05}>
                <div className="h-full rounded-2xl border border-line bg-carbon p-4">
                  <s.icon className="size-5 text-ember" />
                  <p className="mt-3 text-[11px] tracking-[0.14em] text-smoke uppercase">{s.label}</p>
                  <p className="mt-1 font-display text-sm font-bold break-words">{s.value}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15}>
            <div className="mt-10 rounded-3xl border border-line bg-carbon p-6 sm:p-8">
              <h2 className="font-display text-lg font-bold tracking-tight">Every rental includes</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {bike.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-mist/80">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ember/15 text-ember">
                      <ShieldCheck className="size-3.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        {/* right column — sticky booking */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <BookingPanel
            bike={{
              id: bike.id,
              name: bike.name,
              pricePerDay: bike.pricePerDay,
              deposit: bike.deposit,
              status: bike.status,
            }}
            initialPickup={pickup}
            initialReturn={ret}
            initialLocation={location}
          />
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-24">
          <Reveal>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              MORE <span className="text-outline">{categoryLabel[bike.category]?.toUpperCase() ?? "RIDES"}S</span>
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((b, i) => (
              <Reveal key={b.id} delay={i * 0.08}>
                <BikeCard bike={b} />
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
