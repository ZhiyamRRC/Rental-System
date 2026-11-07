import Link from "next/link";
import { Bike, Clock, Mail, MapPin, Phone, Compass } from "lucide-react";
import type { SiteSettings } from "@/lib/settings";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function Footer({ settings }: { settings: SiteSettings }) {
  const { contact, social } = settings;
  return (
    <footer className="border-t border-line bg-carbon">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        {/* columns: centered on mobile, top-aligned + left on desktop */}
        <div className="grid items-start gap-12 text-center sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10 lg:text-left">
          {/* brand */}
          <div className="flex flex-col items-center sm:col-span-2 lg:col-span-1 lg:items-start">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-ember text-ink">
                <Bike className="size-5.5" strokeWidth={2.4} />
              </span>
              <span className="font-display text-base leading-none font-bold tracking-[0.14em]">
                CEYLON RIDE
                <span className="block text-[10px] font-medium tracking-[0.34em] text-smoke">NUWARA ELIYA</span>
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-smoke">
              Scooters, motorbikes, tuk-tuks and SUVs for self-drive adventures through
              Nuwara Eliya&apos;s tea country. Rent. Ride. Roam.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {[
                { href: social.instagram, icon: InstagramIcon, label: "Instagram" },
                { href: social.facebook, icon: FacebookIcon, label: "Facebook" },
                { href: social.tripadvisor, icon: Compass, label: "TripAdvisor" },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-full border border-line text-smoke transition-all hover:border-ember hover:text-ember"
                >
                  <Icon className="size-4.5" />
                </a>
              ))}
            </div>
          </div>

          {/* explore */}
          <nav className="flex flex-col items-center lg:items-start">
            <h4 className="font-display text-xs font-bold tracking-[0.28em] text-ember uppercase">Explore</h4>
            <ul className="mt-5 space-y-3 text-sm text-mist/80">
              {[
                // same order as the landing page sections
                ["Fleet", "/fleet"],
                ["Suggested routes", "/#routes"],
                ["Driving permits", "/#permit"],
                ["About us", "/#about"],
                ["Reviews", "/#reviews"],
                ["The Journal", "/blog"],
                ["FAQ", "/#faq"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-ember">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* fleet */}
          <nav className="flex flex-col items-center lg:items-start">
            <h4 className="font-display text-xs font-bold tracking-[0.28em] text-ember uppercase">Fleet</h4>
            <ul className="mt-5 space-y-3 text-sm text-mist/80">
              {[
                ["Scooters", "/fleet?category=scooter"],
                ["Motorbikes", "/fleet?category=motorbike"],
                ["Tuk-Tuks", "/fleet?category=tuktuk"],
                ["Cars & SUVs", "/fleet?category=car"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="transition-colors hover:text-ember">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* base camp */}
          <div className="flex flex-col items-center sm:col-span-2 lg:col-span-1 lg:items-start">
            <h4 className="font-display text-xs font-bold tracking-[0.28em] text-ember uppercase">Base camp</h4>
            <ul className="mt-5 max-w-xs space-y-4 text-sm text-mist/80 lg:max-w-none">
              <li className="flex items-start justify-center gap-3 lg:justify-start">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ember" />
                {contact.address}
              </li>
              <li className="flex items-start justify-center gap-3 lg:justify-start">
                <Phone className="mt-0.5 size-4 shrink-0 text-ember" />
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-ember">
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-start justify-center gap-3 lg:justify-start">
                <Mail className="mt-0.5 size-4 shrink-0 text-ember" />
                <a href={`mailto:${contact.email}`} className="break-all hover:text-ember">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start justify-center gap-3 lg:justify-start">
                <Clock className="mt-0.5 size-4 shrink-0 text-ember" />
                {contact.hours}
              </li>
            </ul>
          </div>
        </div>

        {/* bottom bar: centered stack on mobile, spread on desktop */}
        <div className="mt-14 flex flex-col items-center gap-5 border-t border-line pt-7 text-xs text-smoke lg:flex-row lg:justify-between">
          <p>© {new Date().getFullYear()} Ceylon Ride Co. All rights reserved.</p>
          <p className="font-hand text-lg text-dune">made for the open road — ride safe</p>
          <Link
            href="/admin"
            className="flex items-center gap-2.5 rounded-full border border-line py-2 pr-5 pl-2 font-display text-[11px] font-bold tracking-[0.2em] text-smoke uppercase transition-colors hover:border-ember hover:text-ember"
          >
            <span className="grid size-6 place-items-center rounded-full bg-ember text-ink">
              <Bike className="size-3.5" strokeWidth={2.4} />
            </span>
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
