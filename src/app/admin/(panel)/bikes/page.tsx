import { asc } from "drizzle-orm";
import { db } from "@/db";
import { bikes, type Bike } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { BikesManager } from "@/components/admin/bikes-manager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Fleet · Garage Control" };

export default async function AdminBikesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, token, viaUrl } = await requireAdmin(await searchParams);

  let initial: Bike[] = [];
  try {
    initial = await db.select().from(bikes).orderBy(asc(bikes.sortOrder));
  } catch (e) {
    console.error("fleet SSR fetch failed (client will retry):", e);
  }

  return (
    <AdminChrome userName={user.name} token={token} viaUrl={viaUrl}>
      <BikesManager initial={initial} />
    </AdminChrome>
  );
}
