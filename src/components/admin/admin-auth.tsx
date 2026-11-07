"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

type AdminAuth = {
  token: string;
  viaUrl: boolean;
  /** Suffix to append to in-panel links so the session survives navigation. */
  linkSuffix: string;
  api: (path: string, init?: RequestInit) => Promise<Response>;
};

const Ctx = createContext<AdminAuth | null>(null);

export function AdminAuthProvider({
  token,
  viaUrl,
  children,
}: {
  token: string;
  viaUrl: boolean;
  children: ReactNode;
}) {
  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        headers.set("x-admin-token", token);
      }
      return fetch(path, { ...init, headers, credentials: "include" });
    },
    [token],
  );

  const value = useMemo<AdminAuth>(
    () => ({ token, viaUrl, linkSuffix: viaUrl && token ? `?at=${token}` : "", api }),
    [token, viaUrl, api],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth(): AdminAuth {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}

/** Convenience hook returning just the authenticated fetch helper. */
export function useAdminApi() {
  return useAdminAuth().api;
}
