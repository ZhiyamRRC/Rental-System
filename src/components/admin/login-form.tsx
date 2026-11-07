"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bike, Clock3, Info, LogIn } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setLocked(json.locked === true);
        setError(json.error || "Login failed.");
        setState("error");
        return;
      }
      setLocked(false);
      // The session is validated SERVER-SIDE from the ?at= token, so the panel
      // works even when cookies AND localStorage are blocked (preview iframes).
      // Best-effort storage write is a convenience only.
      if (json.token) {
        try {
          window.localStorage.setItem("cr_admin_token", json.token);
        } catch {
          /* storage blocked — URL token carries the session */
        }
        router.push(`/admin?at=${encodeURIComponent(json.token)}`);
      } else {
        router.push("/admin");
      }
    } catch {
      setError("Network error — try again.");
      setState("error");
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-ink px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 300px at 20% 10%, rgba(255,77,18,0.14), transparent), radial-gradient(500px 300px at 85% 90%, rgba(255,176,31,0.08), transparent)",
        }}
      />
      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 text-xs text-smoke transition-colors hover:text-ember"
        >
          <ArrowLeft className="size-3.5" /> Back to the site
        </Link>
        <div className="rounded-3xl border border-line bg-carbon p-8">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-ember text-ink">
              <Bike className="size-6" strokeWidth={2.4} />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">Garage Control</h1>
              <p className="text-xs text-smoke">Ceylon Ride Co. admin panel</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-4">
            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] font-bold tracking-[0.18em] text-smoke uppercase">
                Email
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@ceylonride.co"
                className="dark-controls w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm outline-none placeholder:text-smoke focus:border-ember"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-display text-[10px] font-bold tracking-[0.18em] text-smoke uppercase">
                Password
              </span>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••"
                className="dark-controls w-full rounded-xl border border-line bg-ink px-4 py-3 text-sm outline-none placeholder:text-smoke focus:border-ember"
              />
            </label>

            {state === "error" && (
              locked ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber/50 bg-amber/10 px-4 py-3 text-xs leading-relaxed text-amber">
                  <Clock3 className="mt-0.5 size-4 shrink-0" />
                  <p>{error} This cooldown protects the garage and clears automatically.</p>
                </div>
              ) : (
                <p className="rounded-xl border border-ember/50 bg-ember/10 px-4 py-3 text-xs text-ember">{error}</p>
              )
            )}

            <button
              type="submit"
              disabled={state === "sending"}
              className="flex items-center justify-center gap-2 rounded-xl bg-ember py-3.5 font-display text-sm font-bold tracking-wide text-ink uppercase transition-colors hover:bg-amber disabled:opacity-60"
            >
              <LogIn className="size-4" />
              {state === "sending" ? "Checking keys…" : "Enter the garage"}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-line bg-ink/60 p-4 text-xs leading-relaxed text-smoke">
            <Info className="mt-0.5 size-4 shrink-0 text-amber" />
            <p>
              Authorized staff only. Sessions are encrypted, expire automatically, and can be revoked by
              signing out.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
