"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowUpRight,
  Bike as BikeIcon,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  KeyRound,
  MessageSquareQuote,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { formatUsd } from "@/lib/utils";
import type { AdminStats } from "@/lib/admin-stats";
import { PageHeader, StatusPill } from "./ui";
import { useAdminAuth } from "./admin-auth";
import type { ChartPoint, StatusSlice } from "./dashboard-charts";

// Charts ship in their own chunk — KPIs paint instantly, charts stream in.
const DashboardCharts = dynamic(() => import("./dashboard-charts").then((m) => m.DashboardCharts), {
  ssr: false,
  loading: () => <div className="mt-4 h-64 animate-pulse rounded-2xl bg-graphite/60" />,
});

export function DashboardClient({ initial }: { initial: AdminStats | null }) {
  const { api, linkSuffix } = useAdminAuth();
  const [stats, setStats] = useState<AdminStats | null>(initial);
  const [offline, setOffline] = useState(false);
  const [lastError, setLastError] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= 4; attempt += 1) {
      try {
        const res = await api("/api/admin/stats", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as AdminStats;
        setStats(json);
        setOffline(false);
        setLastError("");
        return;
      } catch (error) {
        lastError = error;
        if (attempt < 4) {
          // transient proxy/cold-start blips: backoff ~7s total
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
        }
      }
    }
    const message = lastError instanceof Error ? lastError.message : "network error";
    console.error("[dashboard] stats refresh failed:", message);
    setOffline(true);
    setLastError(message);
  }, [api]);

  // background refresh after hydration; scheduling avoids a synchronous state
  // cascade inside the effect while SSR data remains visible meanwhile.
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function manualRetry() {
    setBusy(true);
    await refresh();
    setBusy(false);
  }

  if (!stats) {
    // No SSR data available and refresh still pending
    if (offline) {
      return (
        <div className="rounded-3xl border border-ember/40 bg-ember/10 p-8 text-center">
          <WifiOff className="mx-auto size-8 text-ember" />
          <p className="mt-3 font-display text-lg font-bold">Couldn&apos;t load the dashboard</p>
          <p className="mt-1 text-sm text-smoke">
            The server answered <span className="font-mono">{lastError || "with an error"}</span> after several
            retries — usually a cold start. Try again.
          </p>
          <button
            onClick={manualRetry}
            disabled={busy}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ember px-6 py-3 font-display text-xs font-bold tracking-[0.14em] text-ink uppercase transition-colors hover:bg-amber disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Retrying…" : "Retry now"}
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-graphite" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl border border-line bg-carbon" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-3xl border border-line bg-carbon" />
      </div>
    );
  }

  const kpis = [
    { icon: CircleDollarSign, label: "Lifetime revenue", value: formatUsd(stats.revenue), hint: "confirmed + completed" },
    { icon: KeyRound, label: "On the road now", value: String(stats.activeNow), hint: "rentals in progress" },
    { icon: Clock3, label: "Awaiting approval", value: String(stats.pending), hint: "new booking requests" },
    {
      icon: BikeIcon,
      label: "Fleet ready",
      value: `${stats.fleetAvailable}/${stats.fleetTotal}`,
      hint: "vehicles available",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        sub={`${stats.totalBookings} total bookings · ${stats.pendingReviews} reviews waiting for approval`}
      >
        {offline && (
          <button
            onClick={manualRetry}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl border border-amber/50 bg-amber/10 px-4 py-2.5 font-display text-[11px] font-bold tracking-[0.14em] text-amber uppercase transition-colors hover:bg-amber/20 disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
            {busy ? "Retrying…" : "Connection hiccup — retry"}
          </button>
        )}
      </PageHeader>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-3xl border border-line bg-carbon p-5">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-ember/15 text-ember">
                <k.icon className="size-5" />
              </span>
            </div>
            <p className="mt-4 font-display text-3xl font-bold tracking-tight">{k.value}</p>
            <p className="mt-1 text-xs font-bold tracking-[0.14em] text-mist/70 uppercase">{k.label}</p>
            <p className="mt-0.5 text-[11px] text-smoke">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="rounded-3xl border border-line bg-carbon p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Bookings — last 14 days</h2>
            <span className="flex items-center gap-1.5 text-xs text-smoke">
              <CalendarDays className="size-3.5 text-ember" /> by day received
            </span>
          </div>
          <DashboardCharts
            series={stats.series as ChartPoint[]}
            statusDist={stats.statusDist as StatusSlice[]}
            mode="area"
          />
        </div>
        <div className="rounded-3xl border border-line bg-carbon p-6">
          <h2 className="font-display text-lg font-bold">Status mix</h2>
          <DashboardCharts
            series={stats.series as ChartPoint[]}
            statusDist={stats.statusDist as StatusSlice[]}
            mode="donut"
          />
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-line bg-carbon">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg font-bold">Latest bookings</h2>
          <Link
            href={`/admin/bookings${linkSuffix}`}
            className="flex items-center gap-1.5 font-display text-xs font-bold tracking-[0.14em] text-ember uppercase"
          >
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-line">
          {stats.recent.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
              <span className="font-mono text-xs font-bold text-ember">{b.reference}</span>
              <div className="min-w-36">
                <p className="truncate text-sm font-bold">{b.customerName}</p>
                <p className="truncate text-xs text-smoke">{b.bikeName}</p>
              </div>
              <p className="text-xs text-smoke">
                {b.pickupDate} → {b.returnDate}
              </p>
              <p className="font-display text-sm font-bold">{formatUsd(b.totalPrice)}</p>
              <span className="ml-auto">
                <StatusPill status={b.status} />
              </span>
            </div>
          ))}
          {stats.recent.length === 0 && (
            <p className="px-6 py-10 text-center text-sm text-smoke">
              No bookings yet — they&apos;ll land here as riders reserve.
            </p>
          )}
        </div>
      </div>

      {stats.pendingReviews > 0 && (
        <Link
          href={`/admin/testimonials${linkSuffix}`}
          className="mt-6 flex items-center justify-between rounded-3xl border border-amber/40 bg-amber/10 px-6 py-4 transition-colors hover:bg-amber/15"
        >
          <span className="flex items-center gap-3 text-sm text-amber">
            <MessageSquareQuote className="size-5" />
            {stats.pendingReviews} rider review{stats.pendingReviews > 1 ? "s" : ""} waiting for your approval
          </span>
          <ArrowUpRight className="size-4 text-amber" />
        </Link>
      )}
    </div>
  );
}
