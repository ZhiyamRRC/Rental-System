"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import type { Bike } from "@/db/schema";
import { BikeCard } from "@/components/site/bike-card";
import { TiltCard } from "@/components/effects/tilt-card";

const tabs = [
  { value: "all", label: "All rides" },
  { value: "scooter", label: "Scooters" },
  { value: "motorbike", label: "Motorbikes" },
  { value: "tuktuk", label: "Tuk-Tuks" },
  { value: "car", label: "Cars & SUVs" },
];

export function FeaturedFleet({ bikes }: { bikes: Bike[] }) {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? bikes : bikes.filter((b) => b.category === tab);

  return (
    <section id="fleet" className="relative mx-auto max-w-7xl scroll-mt-28 px-4 py-24 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-hand text-2xl text-ember">pick your poison</p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-6xl">
            THE <span className="text-outline">FLEET</span>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-smoke">
            A spectrum of adventures on two, three and four wheels — every vehicle under three years
            old and serviced by our own certified mechanics in Nuwara Eliya.
          </p>
        </div>
        <Link
          href="/fleet"
          className="group flex items-center gap-2 font-display text-sm font-bold tracking-[0.16em] text-ember uppercase"
        >
          View all {bikes.length} rides
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-9 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full border px-5 py-2 font-display text-xs font-bold tracking-[0.14em] uppercase transition-all ${
              tab === t.value
                ? "border-ember bg-ember text-ink"
                : "border-line text-smoke hover:border-mist/40 hover:text-mist"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <motion.div layout className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/*
          initial={false}: SSR + first render show cards fully visible — the
          entrance only animates when the filter actually changes. JS failure
          therefore can never hide the fleet.
        */}
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.map((bike) => (
            <motion.div
              key={bike.id}
              layout
              initial={false}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.28 } }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <TiltCard>
                <BikeCard bike={bike} />
              </TiltCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
