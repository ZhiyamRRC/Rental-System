import { desc } from "drizzle-orm";
import { db } from "@/db";
import { testimonials, type Testimonial } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reviews · Garage Control" };

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, token, viaUrl } = await requireAdmin(await searchParams);

  let initial: Testimonial[] = [];
  try {
    initial = await db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
  } catch (e) {
    console.error("testimonials SSR fetch failed (client will retry):", e);
  }

  return (
    <AdminChrome userName={user.name} token={token} viaUrl={viaUrl}>
      <TestimonialsManager initial={initial} />
    </AdminChrome>
  );
}
