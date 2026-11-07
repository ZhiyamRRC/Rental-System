"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bike,
  CalendarDays,
  Gauge,
  LogOut,
  MessageSquareQuote,
  Newspaper,
  Settings,
  SquareArrowOutUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "./admin-auth";

const nav = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/bikes", label: "Fleet", icon: Bike },
  { href: "/admin/blog", label: "Blog", icon: Newspaper },
  { href: "/admin/testimonials", label: "Reviews", icon: MessageSquareQuote },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
];

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { linkSuffix, api } = useAdminAuth();

  async function logout() {
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    try {
      window.localStorage.removeItem("cr_admin_token");
    } catch {
      /* storage blocked */
    }
    router.push("/admin/login");
  }

  const linkCls = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-xl px-4 py-3 font-display text-[13px] font-bold tracking-[0.08em] uppercase transition-colors",
      (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href))
        ? "bg-ember text-ink"
        : "text-smoke hover:bg-graphite hover:text-mist",
    );

  return (
    <>
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-carbon lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <span className="grid size-10 place-items-center rounded-xl bg-ember text-ink">
            <Bike className="size-5.5" strokeWidth={2.4} />
          </span>
          <div>
            <p className="font-display text-sm leading-none font-bold tracking-[0.12em]">
              GARAGE
              <span className="block text-[9px] font-medium tracking-[0.3em] text-smoke">CONTROL PANEL</span>
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <Link key={n.href} href={`${n.href}${linkSuffix}`} className={linkCls(n.href)}>
              <n.icon className="size-4.5" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-display text-[13px] font-bold tracking-[0.08em] text-smoke uppercase transition-colors hover:bg-graphite hover:text-mist"
          >
            <SquareArrowOutUpRight className="size-4.5" />
            View site
          </Link>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-graphite px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-mist">{userName}</p>
              <p className="text-[10px] tracking-wider text-smoke uppercase">Fleet manager</p>
            </div>
            <button
              onClick={logout}
              className="grid size-9 shrink-0 place-items-center rounded-lg border border-line text-smoke transition-colors hover:border-ember hover:text-ember"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-line bg-carbon/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-ember text-ink">
              <Bike className="size-4.5" strokeWidth={2.4} />
            </span>
            <span className="font-display text-xs font-bold tracking-[0.16em]">GARAGE CONTROL</span>
          </span>
          <button
            onClick={logout}
            className="grid size-9 place-items-center rounded-lg border border-line text-smoke"
            aria-label="Log out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={`${n.href}${linkSuffix}`}
              className={cn(linkCls(n.href), "shrink-0 px-3 py-2 text-[11px]")}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
