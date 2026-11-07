"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, Bike, Menu, Phone, X, Zap } from "lucide-react";

/**
 * Navigation order mirrors the landing page section order exactly, so clicking
 * down the menu walks the page top-to-bottom:
 *   Hero → Fleet → Routes → Permits → About → Reviews → Journal → FAQ → CTA
 * Every entry is an in-page anchor, giving uninterrupted smooth scrolling.
 * The "Book a ride" CTA and footer still link to the /fleet and /blog pages.
 */
const links = [
  { id: "fleet", href: "/#fleet", label: "Fleet" },
  { id: "routes", href: "/#routes", label: "Routes" },
  { id: "permit", href: "/#permit", label: "Permits" },
  { id: "about", href: "/#about", label: "About" },
  { id: "reviews", href: "/#reviews", label: "Reviews" },
  { id: "journal", href: "/#journal", label: "Journal" },
  { id: "faq", href: "/#faq", label: "FAQ" },
];

export function Navbar({ announcement, phone }: { announcement: string | null; phone: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const visible = useRef(new Map<string, boolean>());

  // Hide on scroll down, reveal on scroll up — spring-smoothed.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > prev + 4 && y > 260 && !open);
    if (y < prev - 4 || y <= 260) setHidden(false);
  });

  // Scroll spy — highlights the section currently in view. Purely additive:
  // when the sections don't exist (e.g. /fleet, /blog) nothing is highlighted.
  useEffect(() => {
    const sections = links
      .map((l) => document.getElementById(l.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.current.set(entry.target.id, entry.isIntersecting);
        // links are in page order, so the first match is the topmost section in view
        setActive(links.find((l) => visible.current.get(l.id))?.id ?? "");
      },
      { rootMargin: "-25% 0px -65% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* translate-only visibility toggle: SSR renders fully visible; scroll motion is an enhancement */}
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={false}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      >
        {announcement && !scrolled && (
          <div className="flex items-center justify-center gap-2 bg-ember px-4 py-2 text-center">
            <Zap className="size-3.5 shrink-0 fill-ink text-ink" />
            <p className="truncate font-display text-[11px] font-semibold tracking-[0.18em] text-ink uppercase sm:text-xs">
              {announcement}
            </p>
          </div>
        )}
        <div
          className={`transition-all duration-500 ${
            scrolled
              ? "border-b border-line bg-ink/85 backdrop-blur-xl"
              : "border-b border-transparent bg-transparent"
          }`}
        >
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
            <Link href="/" className="group flex items-center gap-2.5" aria-label="Ceylon Ride Co. home">
              <span className="grid size-9 place-items-center rounded-xl bg-ember text-ink transition-transform duration-300 group-hover:-rotate-6">
                <Bike className="size-5" strokeWidth={2.4} />
              </span>
              <span className="font-display text-sm leading-none font-bold tracking-[0.14em]">
                CEYLON RIDE
                <span className="block text-[10px] font-medium tracking-[0.34em] text-smoke">NUWARA ELIYA</span>
              </span>
            </Link>

            <div className="hidden items-center gap-7 lg:flex">
              {links.map((l) => {
                const isActive = active === l.id;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={isActive ? "true" : undefined}
                    className={`group relative font-display text-[13px] font-medium tracking-[0.12em] uppercase transition-colors ${
                      isActive ? "text-ember" : "text-mist/80 hover:text-mist"
                    }`}
                  >
                    {l.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-px bg-ember transition-all duration-300 ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="hidden items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-medium text-mist/80 transition-colors hover:border-mist/40 hover:text-mist md:flex"
              >
                <Phone className="size-3.5" />
                {phone}
              </a>
              <Link
                href="/fleet"
                className="hidden items-center gap-1.5 rounded-full bg-ember px-5 py-2.5 font-display text-[13px] font-bold tracking-wide text-ink uppercase transition-all hover:bg-amber sm:flex"
              >
                Book a ride
                <ArrowUpRight className="size-4" />
              </Link>
              <button
                onClick={() => setOpen(true)}
                className="grid size-10 place-items-center rounded-full border border-line text-mist lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col bg-ink/97 backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between px-4 py-4 sm:px-6">
              <span className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-ember text-ink">
                  <Bike className="size-5" strokeWidth={2.4} />
                </span>
                <span className="font-display text-sm font-bold tracking-[0.14em]">CEYLON RIDE CO.</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="grid size-10 place-items-center rounded-full border border-line"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 px-8">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline gap-4 border-b border-line/60 py-4"
                  >
                    <span className="font-display text-xs text-ember">0{i + 1}</span>
                    <span
                      className={`font-display text-4xl font-bold tracking-tight transition-colors group-hover:text-ember ${
                        active === l.id ? "text-ember" : ""
                      }`}
                    >
                      {l.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="px-8 pb-10">
              <Link
                href="/fleet"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-ember py-4 font-display text-sm font-bold tracking-wide text-ink uppercase"
              >
                Book a ride <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
