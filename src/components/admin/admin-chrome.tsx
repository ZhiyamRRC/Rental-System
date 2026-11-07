"use client";

import type { ReactNode } from "react";
import { AdminAuthProvider } from "./admin-auth";
import { AdminNav } from "./sidebar";

export function AdminChrome({
  userName,
  token,
  viaUrl,
  children,
}: {
  userName: string;
  token: string;
  viaUrl: boolean;
  children: ReactNode;
}) {
  return (
    <AdminAuthProvider token={token} viaUrl={viaUrl}>
      <div className="min-h-svh bg-ink">
        <AdminNav userName={userName} />
        <div className="lg:pl-64">
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
        </div>
      </div>
    </AdminAuthProvider>
  );
}
