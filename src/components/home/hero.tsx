"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { ArrowDown, ArrowUpRight, CalendarDays, MapPin, Star, Bike as BikeIcon } from "lucide-react";
import type { HeroSettings, ImageSettings } from "@/lib/settings";
import { pickupLocations, todayIso } from "@/lib/utils";

/** Count-up on mount. SSR shows the final value, so no-JS users see it too. */
function CountUp({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState<string>(value.toFixed(decimals) + suffix);
  useEffect(() => {
    const duration = 1400;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (start === 0) {
        start = now;
        setDisplay("0" + suffix);
      }
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay((value * eased).toFixed(decimals) + suffix);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, suffix, decimals]);
  return <>{display}</>;
}

const locations = [...pickupLocations];
const categories = [
  { value: "", label: "Any wheels" },
  { value: "scooter", label: "Scooter" },
  { value: "motorbike", label: "Motorbike" },
  { value: "tuktuk", label: "Tuk-Tuk" },
  { value: "car", label: "Car & SUV" },
];

const inputCls =
  "dark-controls w-full rounded-xl border border-line bg-ink/60 px-3.5 py-3 text-sm text-mist outline-none transition-colors focus:border-ember placeholder:text-smoke";

export function Hero({ hero, images }: { hero: HeroSettings; images: ImageSettings }) {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);

  // Scroll parallax: springs smooth it; SSR renders a plain static div so the
  // image is fully visible without JS — motion only layers motion on top.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useSpring(useTransform(scrollYProgress, [0, 1], ["0%", "16%"]), { stiffness: 90, damping: 24 });
  const bgScale = useSpring(useTransform(scrollYProgress, [0, 1], [1.05, 1.22]), { stiffness: 90, damping: 24 });

  const [location, setLocation] = useState<string>(locations[0]);
  const [category, setCategory] = useState("");
  const [pickup, setPickup] = useState(todayIso());
  const [ret, setRet] = useState(() => new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10));

  function search(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("pickup", pickup);
    params.set("return", ret);
    params.set("location", location);
    router.push(`/fleet?${params.toString()}`);
  }

  return (
    <section ref={ref} className="relative flex min-h-svh flex-col overflow-hidden">
      {/* parallax background — SSR-static, springs enhance on the client */}
      <motion.div className="absolute inset-0" style={{ y: bgY, scale: bgScale }}>
        <Image
          src={images.hero}
          alt="Riders on scooters and motorbikes winding through the tea-green hills above Nuwara Eliya"
          fill
          priority
          className="object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/55 to-ink/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/60" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pt-36 pb-16 sm:px-6">
        <div className="rise flex items-center gap-3" style={{ "--d": "0.05s" } as React.CSSProperties}>
          <span className="h-px w-10 bg-ember" />
          <p className="font-display text-xs font-semibold tracking-[0.3em] text-ember uppercase">{hero.eyebrow}</p>
        </div>

        <h1 className="mt-6 font-display text-[clamp(3.4rem,11vw,9rem)] leading-[0.88] font-bold tracking-tight">
          {[
            { text: hero.titleA, cls: "text-mist", d: "0.12s" },
            { text: hero.titleB, cls: "text-outline", d: "0.24s" },
            { text: hero.titleC, cls: "text-ember", d: "0.36s" },
          ].map((l) => (
            <span
              key={l.text}
              className={`rise block ${l.cls}`}
              style={{ "--d": l.d, "--r": "1.5deg" } as React.CSSProperties}
            >
              {l.text}
            </span>
          ))}
        </h1>

        <p
          className="rise mt-6 max-w-xl text-base leading-relaxed text-mist/75 sm:text-lg"
          style={{ "--d": "0.48s" } as React.CSSProperties}
        >
          {hero.subtitle}
        </p>

        <span
          className="rise pointer-events-none mt-4 font-hand text-2xl text-amber sm:absolute sm:top-[26%] sm:right-[8%] sm:text-3xl"
          style={{ "--d": "0.7s", "--r": "-6deg" } as React.CSSProperties}
        >
          1,868m above the tour buses
        </span>

        {/* booking widget */}
        <form
          onSubmit={search}
          className="rise mt-10 grid gap-3 rounded-3xl border border-mist/10 bg-carbon/70 p-4 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1fr_auto]"
          style={{ "--d": "0.6s" } as React.CSSProperties}
        >
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 font-display text-[10px] font-bold tracking-[0.2em] text-smoke uppercase">
              <MapPin className="size-3 text-ember" /> Pickup
            </span>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls}>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 font-display text-[10px] font-bold tracking-[0.2em] text-smoke uppercase">
              <BikeIcon className="size-3 text-ember" /> Wheels
            </span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 font-display text-[10px] font-bold tracking-[0.2em] text-smoke uppercase">
              <CalendarDays className="size-3 text-ember" /> From
            </span>
            <input type="date" value={pickup} min={todayIso()} onChange={(e) => setPickup(e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 font-display text-[10px] font-bold tracking-[0.2em] text-smoke uppercase">
              <CalendarDays className="size-3 text-ember" /> Until
            </span>
            <input type="date" value={ret} min={pickup} onChange={(e) => setRet(e.target.value)} className={inputCls} />
          </label>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-ember px-6 py-3 font-display text-sm font-bold tracking-wide text-ink uppercase transition-colors hover:bg-amber lg:self-end"
          >
            Find your ride <ArrowUpRight className="size-4" />
          </button>
        </form>

        {/* stats strip */}
        <div
          className="rise mt-10 grid grid-cols-2 gap-6 border-t border-mist/10 pt-7 sm:grid-cols-4"
          style={{ "--d": "0.85s" } as React.CSSProperties}
        >
          {[
              { value: 40, suffix: "+", label: "rides in fleet", decimals: 0 },
              { value: 12, suffix: "k+", label: "riders & counting", decimals: 0 },
              { value: 4.9, suffix: "", label: "average rating", decimals: 1, star: true },
              { value: 24, suffix: "/7", label: "hill-country rescue", decimals: 0 },
          ].map((s) => (
            <div key={s.label}>
              <p className="flex items-center gap-1.5 font-display text-2xl font-bold text-mist tabular-nums sm:text-3xl">
                <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals} />
                {s.star ? <Star className="size-4 fill-amber text-amber" /> : null}
              </p>
              <p className="mt-1 text-xs tracking-wide text-smoke uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bob absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-smoke lg:block">
        <ArrowDown className="size-5" />
      </div>
    </section>
  );
}
