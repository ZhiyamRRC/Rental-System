import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { AdminUser } from "@/db/schema";
import { getAdminUser, getAdminUserByToken } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";

export type AdminSession = {
  user: AdminUser;
  token: string;
  /** true when the session came from the URL (cookies unavailable) — links must carry ?at= */
  viaUrl: boolean;
};

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Server-side admin guard. Validates the session BEFORE rendering, so the
 * panel never depends on browser storage (localStorage/cookies can both be
 * blocked inside cross-site preview iframes).
 *
 * Order: ?at= URL token → httpOnly cookie → redirect to login.
 */
export async function requireAdmin(searchParams?: SearchParams): Promise<AdminSession> {
  try {
    await ensureDatabase();
  } catch (e) {
    console.error("ensureDatabase failed:", e);
  }

  const at = typeof searchParams?.at === "string" ? searchParams.at.trim() : "";
  if (at) {
    const user = await getAdminUserByToken(at);
    if (user) return { user, token: at, viaUrl: true };
  }

  const cookieUser = await getAdminUser();
  if (cookieUser) {
    let token = "";
    try {
      const store = await cookies();
      token = store.get("cr_admin")?.value ?? "";
    } catch {
      /* ignore */
    }
    return { user: cookieUser, token, viaUrl: false };
  }

  redirect("/admin/login");
}
