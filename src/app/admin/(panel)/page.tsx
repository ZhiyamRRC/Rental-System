import { requireAdmin } from "@/lib/admin-guard";
import { computeAdminStats } from "@/lib/admin-stats";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { DashboardClient } from "@/components/admin/dashboard-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard · Garage Control" };

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, token, viaUrl } = await requireAdmin(await searchParams);

  // Stats render INTO the page HTML — data is visible even before/without
  // the client-side refresh fetch. The client refreshes in the background.
  let initial = null;
  try {
    initial = await computeAdminStats();
  } catch (e) {
    console.error("dashboard SSR stats failed (page still renders):", e);
  }

  return (
    <AdminChrome userName={user.name} token={token} viaUrl={viaUrl}>
      <DashboardClient initial={initial} />
    </AdminChrome>
  );
}
