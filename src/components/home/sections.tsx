import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileCheck,
  KeyRound,
  MapPin,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import type { SiteSettings } from "@/lib/settings";

/* --------------------------------- Routes --------------------------------- */

const routes = [
  {
    name: "Tea Country Loop",
    days: "1 day",
    km: "46 km",
    stops: ["Town", "Pedro Estate", "Lovers Leap", "Moon Plains"],
    desc: "The perfect first ride: factory tours, a waterfall picnic and a misty grassland viewpoint — all before lunch.",
  },
  {
    name: "Horton Plains Sunrise Run",
    days: "1 day",
    km: "64 km",
    stops: ["Nuwara Eliya", "Ohiya", "World's End"],
    desc: "Roll out at 5am, climb through the cloud line and stand on World's End before the mist closes in.",
  },
  {
    name: "Ella Overnight Escape",
    days: "3 days",
    km: "190 km",
    stops: ["Nuwara Eliya", "Ramboda", "Ella"],
    desc: "South past the falls to the Nine Arches Bridge, one guesthouse night, and a golden ride home along the ridge.",
  },
];

export function RoutesStrip() {
  return (
    <section id="routes" className="scroll-mt-28 border-y border-line bg-carbon py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-hand text-2xl text-ember">fuel for the itinerary</p>
              <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-6xl">
                ROUTES WE <span className="text-outline">LOVE</span>
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-smoke">
              Every booking comes with our local route notes — fuel stops, mist windows, and which
              estate serves the best tea on the way down.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {routes.map((r, i) => (
            <Reveal key={r.name} delay={i * 0.12}>
              <div className="group relative h-full overflow-hidden rounded-3xl border border-line bg-graphite p-7 transition-colors duration-500 hover:border-ember/50">
                <span className="absolute -top-6 right-3 font-display text-[7rem] leading-none font-bold text-mist/5 transition-colors duration-500 group-hover:text-ember/10">
                  0{i + 1}
                </span>
                <div className="flex gap-2">
                  <span className="rounded-full bg-ember px-3 py-1 font-display text-[10px] font-bold tracking-[0.16em] text-ink uppercase">
                    {r.days}
                  </span>
                  <span className="rounded-full border border-line px-3 py-1 font-display text-[10px] font-bold tracking-[0.16em] text-smoke uppercase">
                    {r.km}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">{r.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-smoke">{r.desc}</p>
                <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs font-medium text-mist/70">
                  {r.stops.map((s, j) => (
                    <span key={s} className="flex items-center gap-2">
                      {j > 0 && <ArrowRight className="size-3 text-ember" />}
                      <MapPin className="size-3 text-ember" />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Permit --------------------------------- */

const steps = [
  {
    icon: FileCheck,
    title: "Send your license",
    desc: "Snap a photo of your home license + IDP (A-category for bikes). Send it when you book.",
  },
  {
    icon: ShieldCheck,
    title: "We verify & endorse",
    desc: "Our crew handles the AA endorsement and local recognition paperwork before you reach the hills.",
  },
  {
    icon: KeyRound,
    title: "Collect & ride",
    desc: "Pick up your permit copy with the keys at our town garage. Fully legal from day one.",
  },
];

export function Permit({ images }: { images: SiteSettings["images"] }) {
  return (
    <section id="permit" className="scroll-mt-28 bg-mist py-24 text-ink">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="relative mx-auto max-w-lg rotate-[-2deg] overflow-hidden rounded-3xl border-8 border-ink shadow-[24px_24px_0_0_var(--color-ember)]">
            <Image
              src={images.permit}
              alt="International driving permit, helmet and map on a wooden table"
              width={900}
              height={700}
              className="h-auto w-full object-cover"
            />
          </div>
          <span className="absolute -bottom-2 left-6 rotate-[-4deg] font-hand text-2xl text-ember-deep sm:text-3xl">
            paperwork: handled
          </span>
        </Reveal>

        <div>
          <Reveal>
            <p className="font-hand text-2xl text-ember-deep">ride legal, ride relaxed</p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              YOUR SRI LANKAN PERMIT, <span className="text-outline-ink">SORTED IN 48H</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink/70 sm:text-base">
              Foreign licenses need a local endorsement to ride legally in Sri Lanka. Skip the queues at
              the Automobile Association — we arrange everything so you arrive in Nuwara Eliya, sign,
              and roll out.
            </p>
          </Reveal>

          <div className="mt-9 space-y-6">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={0.12 + i * 0.1}>
                <div className="flex gap-5">
                  <div className="relative">
                    <span className="grid size-12 place-items-center rounded-2xl bg-ink text-ember">
                      <s.icon className="size-5.5" />
                    </span>
                    <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-ember font-display text-[10px] font-bold text-ink">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold">{s.title}</h3>
                    <p className="mt-1 max-w-md text-sm leading-relaxed text-ink/65">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/fleet"
                className="flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-display text-sm font-bold tracking-wide text-mist uppercase transition-colors hover:bg-ember hover:text-ink"
              >
                Book + add permit <ArrowUpRight className="size-4" />
              </Link>
              <p className="text-xs text-ink/60">
                Permit service <span className="font-bold text-ink">$40</span> · processed in ~48 hours
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- About ---------------------------------- */

export function About({ settings }: { settings: SiteSettings }) {
  const { about } = settings;
  return (
    <section id="about" className="scroll-mt-28 py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Reveal>
            <p className="font-hand text-2xl text-ember">a glimpse at our inner workings</p>
            <h2 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              {about.heading.toUpperCase()}
            </h2>
          </Reveal>
          {about.paragraphs.map((p, i) => (
            <Reveal key={i} delay={0.1 + i * 0.08}>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-mist/70 sm:text-base">{p}</p>
            </Reveal>
          ))}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {about.bullets.map((b, i) => (
              <Reveal key={b} delay={0.15 + i * 0.07}>
                <div className="flex items-start gap-3 rounded-2xl border border-line bg-carbon p-4">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ember/15 text-ember">
                    <Check className="size-3.5" />
                  </span>
                  <p className="text-sm leading-snug text-mist/80">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="relative">
          <div className="relative overflow-hidden rounded-3xl">
            <Image
              src={settings.images.about}
              alt="Travelers with their motorbike overlooking Sri Lankan tea hills"
              width={900}
              height={760}
              className="h-auto w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-mist/15 bg-ink/70 px-5 py-4 backdrop-blur-xl">
              <span className="grid size-10 place-items-center rounded-xl bg-ember text-ink">
                <Wrench className="size-5" />
              </span>
              <div>
                <p className="font-display text-lg leading-none font-bold">In-house workshop</p>
                <p className="mt-1 text-xs text-smoke">every ride serviced after every trip</p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              ["8", "years riding"],
              ["40+", "fleet size"],
              ["1,868m", "above sea level"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-line bg-carbon py-5">
                <p className="font-display text-2xl font-bold text-ember sm:text-3xl">{v}</p>
                <p className="mt-1 text-[11px] tracking-wide text-smoke uppercase">{l}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------- CTA ----------------------------------- */

export function CtaBand({ whatsapp, images }: { whatsapp: string; images: SiteSettings["images"] }) {
  return (
    <section className="relative overflow-hidden">
      <Image src={images.cta} alt="A winding mountain road above Nuwara Eliya enveloped in twilight fog" fill className="object-cover" />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="relative mx-auto max-w-7xl px-4 py-32 text-center sm:px-6">
        <Reveal>
          <p className="font-hand text-3xl text-amber">the mist is calling</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-5xl font-bold tracking-tight sm:text-7xl">
            THE HILLS ARE <span className="text-ember">WAITING.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-mist/75 sm:text-base">
            Keys in hand within an hour of reaching town — or delivered to your hotel door. Reserve now,
            pay on pickup, cancel free up to 48 hours before.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/fleet"
              className="flex items-center gap-2 rounded-full bg-ember px-8 py-4 font-display text-sm font-bold tracking-wide text-ink uppercase transition-colors hover:bg-amber"
            >
              Browse the fleet <ArrowUpRight className="size-4" />
            </Link>
            <a
              href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-full border border-mist/30 px-8 py-4 font-display text-sm font-bold tracking-wide text-mist uppercase transition-colors hover:border-mist hover:bg-mist/10"
            >
              WhatsApp us
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
