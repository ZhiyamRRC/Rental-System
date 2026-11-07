"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Compass } from "lucide-react";
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

const sorts = [
  { value: "featured", label: "Featured first" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "engine", label: "Engine size" },
];

export function FleetBrowser({
  bikes,
  initialCategory,
  trip,
  onTourIds,
}: {
  bikes: Bike[];
  initialCategory: string;
  trip: { days: number; pickup: string; ret: string } | null;
  onTourIds: number[];
}) {
  const [tab, setTab] = useState(tabs.some((t) => t.value === initialCategory) ? initialCategory : "all");
  const [sort, setSort] = useState("featured");

  const filtered = useMemo(() => {
    let list = tab === "all" ? [...bikes] : bikes.filter((b) => b.category === tab);
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case "price-desc":
        list.sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      case "engine":
        list.sort((a, b) => b.engineCc - a.engineCc);
        break;
      default:
        list.sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder);
    }
    return list;
  }, [bikes, tab, sort]);

  const onTour = new Set(onTourIds);

  return (
    <div className="mt-10">
      <div className="sticky top-[68px] z-30 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-full border px-4 py-2 font-display text-[11px] font-bold tracking-[0.14em] uppercase transition-all ${
                tab === t.value
                  ? "border-ember bg-ember text-ink"
                  : "border-line text-smoke hover:border-mist/40 hover:text-mist"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="dark-controls appearance-none rounded-full border border-line bg-ink py-2 pr-9 pl-4 font-display text-[11px] font-bold tracking-[0.14em] text-mist uppercase outline-none focus:border-ember"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-smoke" />
        </div>
      </div>

      <motion.div layout className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.map((bike) => (
            <motion.div
              key={bike.id}
              layout
              initial={false}
              exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.28 } }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative"
            >
              {onTour.has(bike.id) && (
                <span className="absolute -top-2.5 left-5 z-10 rounded-full bg-amber px-3 py-1 font-display text-[10px] font-bold tracking-[0.16em] text-ink uppercase shadow-lg">
                  On tour right now
                </span>
              )}
              <TiltCard max={5}>
                <BikeCard bike={bike} trip={trip} />
              </TiltCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line py-20 text-center">
          <Compass className="size-10 text-smoke" />
          <p className="font-display text-xl font-bold">No rides in this category yet</p>
          <p className="max-w-sm text-sm text-smoke">
            The crew adds new stock every season — try another category or check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
