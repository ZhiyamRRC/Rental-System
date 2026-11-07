"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, CircleAlert, Info, MapPin, ShieldCheck, Wallet } from "lucide-react";
import { daysBetween, formatUsd, pickupLocations, todayIso } from "@/lib/utils";
import { countries, popularCountries } from "@/lib/countries";

const locations = [...pickupLocations];

const inputCls =
  "dark-controls w-full rounded-xl border border-line bg-ink/60 px-3.5 py-2.5 text-sm text-mist outline-none transition-colors focus:border-ember placeholder:text-smoke";

type Props = {
  bike: { id: number; name: string; pricePerDay: number; deposit: number; status: string };
  initialPickup: string;
  initialReturn: string;
  initialLocation?: string;
};

export function BookingPanel({ bike, initialPickup, initialReturn, initialLocation }: Props) {
  const router = useRouter();
  const [pickup, setPickup] = useState(initialPickup);
  const [ret, setRet] = useState(initialReturn);
  const [location, setLocation] = useState<string>(initialLocation || locations[0]);
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  const days = useMemo(() => daysBetween(pickup, ret), [pickup, ret]);
  const total = days * bike.pricePerDay;
  const available = bike.status === "available";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (days < 1) {
      setError("Return date must be after the pickup date.");
      setState("error");
      return;
    }
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          bikeId: bike.id,
          pickupDate: pickup,
          returnDate: ret,
          pickupLocation: location,
          partySize: Number(data.partySize || 1),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Something went wrong — please try again.");
        setState("error");
        return;
      }
      router.push(`/bookings/${json.reference}`);
    } catch {
      setError("Network hiccup — check your connection and retry.");
      setState("error");
    }
  }

  return (
    <div>
      <div className="overflow-hidden rounded-3xl border border-line bg-carbon">
        <div className="flex items-end justify-between bg-graphite px-6 py-5">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-smoke uppercase">From</p>
            <p className="font-display text-3xl font-bold">
              {formatUsd(bike.pricePerDay)}
              <span className="text-sm font-medium text-smoke">/day</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[11px] text-smoke">
            <Wallet className="size-3.5 text-ember" />
            {formatUsd(bike.deposit)} refundable deposit
          </div>
        </div>

        {available ? (
          <form onSubmit={submit} className="grid gap-3 p-6">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 font-display text-[10px] font-bold tracking-[0.18em] text-smoke uppercase">
                  <CalendarDays className="size-3 text-ember" /> Pickup
                </span>
                <input
                  type="date"
                  value={pickup}
                  min={todayIso()}
                  onChange={(e) => setPickup(e.target.value)}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 font-display text-[10px] font-bold tracking-[0.18em] text-smoke uppercase">
                  <CalendarDays className="size-3 text-ember" /> Return
                </span>
                <input type="date" value={ret} min={pickup} onChange={(e) => setRet(e.target.value)} className={inputCls} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 font-display text-[10px] font-bold tracking-[0.18em] text-smoke uppercase">
                <MapPin className="size-3 text-ember" /> Pickup point
              </span>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls}>
                {locations.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <input name="customerName" required placeholder="Full name" className={inputCls} />
              <input name="phone" required placeholder="WhatsApp / phone" className={inputCls} />
            </div>
            <input name="email" type="email" required placeholder="Email address" className={inputCls} />
            <div className="grid grid-cols-2 gap-3">
              <select
                name="licenseCountry"
                required
                defaultValue=""
                aria-label="Country that issued your driving licence"
                className={inputCls}
              >
                <option value="" disabled>
                  Licence country…
                </option>
                <optgroup label="Frequently selected">
                  {popularCountries.map((c) => (
                    <option key={`top-${c}`} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All countries">
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              </select>
              <select name="partySize" defaultValue="1" className={inputCls}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} rider{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              name="message"
              rows={2}
              placeholder="Anything we should know? (one-way drop, surfboard rack…)"
              className={inputCls}
            />

            {/* price breakdown */}
            <div className="mt-1 space-y-2 rounded-2xl border border-line bg-ink/50 p-4 text-sm">
              <div className="flex justify-between text-mist/75">
                <span>
                  {formatUsd(bike.pricePerDay)} × {days} day{days === 1 ? "" : "s"}
                </span>
                <span className="font-medium text-mist">{formatUsd(total)}</span>
              </div>
              <div className="flex justify-between text-mist/75">
                <span>Insurance · helmets · unlimited km</span>
                <span className="font-medium text-seafoam">included</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-display text-base font-bold">
                <span>Trip total</span>
                <span className="text-ember">{formatUsd(total)}</span>
              </div>
            </div>

            {state === "error" && (
              <p className="flex items-start gap-2 rounded-xl border border-ember/50 bg-ember/10 px-4 py-3 text-xs leading-relaxed text-ember">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={state === "sending" || days < 1}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-ember py-4 font-display text-sm font-bold tracking-wide text-ink uppercase transition-colors hover:bg-amber disabled:opacity-60"
            >
              {state === "sending" ? "Locking it in…" : `Reserve for ${formatUsd(total)}`}
              <ArrowRight className="size-4" />
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-smoke">
              <ShieldCheck className="size-3.5 text-seafoam" />
              Free cancellation up to 48h before pickup · pay on arrival
            </p>
          </form>
        ) : (
          <div className="p-6">
            <p className="flex items-start gap-3 rounded-2xl border border-amber/40 bg-amber/10 p-4 text-sm leading-relaxed text-amber">
              <Info className="mt-0.5 size-5 shrink-0" />
              This ride is currently in the workshop. Browse the rest of the fleet — or WhatsApp us and
              we&apos;ll tell you the day it&apos;s back on the road.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
