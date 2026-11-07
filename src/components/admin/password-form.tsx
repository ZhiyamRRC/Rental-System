"use client";

import { useState } from "react";
import { CircleCheck, KeyRound, ShieldAlert } from "lucide-react";
import { AdminButton, adminInput, adminLabel } from "./ui";
import { useAdminApi } from "./admin-auth";
import { apiError } from "./api-utils";

export function PasswordForm() {
  const api = useAdminApi();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    if (data.newPassword !== data.confirmPassword) {
      setError("New passwords do not match.");
      setState("error");
      return;
    }

    setState("saving");
    setError("");
    try {
      const res = await api("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (!res.ok) throw new Error(await apiError(res, `Change failed (HTTP ${res.status}).`));
      form.reset();
      setState("saved");
      setTimeout(() => setState("idle"), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error — try again.");
      setState("error");
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="flex items-start gap-3 rounded-2xl border border-amber/40 bg-amber/10 px-4 py-3 text-xs leading-relaxed text-amber">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        Changing the password signs out every other device. For public launch also set{" "}
        <code className="rounded bg-ink/60 px-1 py-0.5">ADMIN_PASSWORD</code> in your environment — it seeds the
        account on fresh databases.
      </div>
      <label className="block">
        <span className={adminLabel}>Current password</span>
        <input name="currentPassword" type="password" required autoComplete="current-password" className={adminInput} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={adminLabel}>New password</span>
          <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className={adminInput} />
        </label>
        <label className="block">
          <span className={adminLabel}>Confirm new password</span>
          <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className={adminInput} />
        </label>
      </div>
      <p className="text-[11px] text-smoke">Minimum 8 characters, at least one letter and one digit.</p>
      {state === "error" && (
        <p className="rounded-xl border border-ember/50 bg-ember/10 px-4 py-3 text-xs text-ember">{error}</p>
      )}
      {state === "saved" && (
        <p className="flex items-center gap-2 rounded-xl border border-seafoam/40 bg-seafoam/10 px-4 py-3 text-xs text-seafoam">
          <CircleCheck className="size-4" /> Password updated — other sessions were signed out.
        </p>
      )}
      <div className="flex justify-end">
        <AdminButton type="submit" disabled={state === "saving"}>
          <KeyRound className="size-4" /> {state === "saving" ? "Updating…" : "Update password"}
        </AdminButton>
      </div>
    </form>
  );
}
