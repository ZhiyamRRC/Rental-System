import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Cog, Gauge, Users, Wrench } from "lucide-react";
import type { Bike } from "@/db/schema";
import { categoryLabel, formatUsd } from "@/lib/utils";

export function BikeCard({ bike, trip }: { bike: Bike; trip?: { days: number } | null }) {
  const maintenance = bike.status === "maintenance";
  return (
    <Link
      href={`/fleet/${bike.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-parchment text-ink transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_60px_-24px_rgba(255,77,18,0.45)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={bike.imageUrl}
          alt={bike.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="rounded-full bg-ink/85 px-3 py-1 font-display text-[10px] font-bold tracking-[0.18em] text-mist uppercase backdrop-blur">
            {categoryLabel[bike.category] ?? bike.category}
          </span>
          {maintenance && (
            <span className="flex items-center gap-1 rounded-full bg-amber px-3 py-1 font-display text-[10px] font-bold tracking-[0.18em] text-ink uppercase">
              <Wrench className="size-3" /> In the shop
            </span>
          )}
        </div>
        <div className="absolute right-4 bottom-4 grid size-11 translate-y-2 place-items-center rounded-full bg-ember text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-5" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg leading-tight font-bold tracking-tight">{bike.name}</h3>
            <p className="mt-0.5 font-hand text-lg leading-tight text-ember-deep">{bike.tagline}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl leading-none font-bold">
              {formatUsd(bike.pricePerDay)}
              <span className="text-xs font-medium text-ink/50">/day</span>
            </p>
            {trip && trip.days > 0 && (
              <p className="mt-1 rounded-full bg-ember px-2 py-0.5 text-[11px] font-bold text-ink">
                {formatUsd(trip.days * bike.pricePerDay)} / {trip.days}d
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 border-t border-ink/10 pt-4 text-xs font-medium text-ink/70">
          <span className="flex items-center gap-1.5">
            <Gauge className="size-3.5 text-ember-deep" />
            {bike.engineCc}cc
          </span>
          <span className="flex items-center gap-1.5">
            <Cog className="size-3.5 text-ember-deep" />
            {bike.transmission.includes("Auto") ? "Auto" : "Manual"}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-ember-deep" />
            {bike.seats} seats
          </span>
        </div>
      </div>
    </Link>
  );
}
