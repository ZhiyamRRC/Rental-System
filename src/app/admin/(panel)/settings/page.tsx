import { getSettings } from "@/lib/settings";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { SettingsForm } from "@/components/admin/settings-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Site settings · Garage Control" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, token, viaUrl } = await requireAdmin(await searchParams);
  const initial = await getSettings();
  return (
    <AdminChrome userName={user.name} token={token} viaUrl={viaUrl}>
      <SettingsForm initial={initial} />
    </AdminChrome>
  );
}
