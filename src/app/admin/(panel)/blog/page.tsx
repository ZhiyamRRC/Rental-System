import { desc } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts, type BlogPost } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { BlogManager } from "@/components/admin/blog-manager";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blog · Garage Control" };

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, token, viaUrl } = await requireAdmin(await searchParams);

  let initial: BlogPost[] = [];
  try {
    initial = await db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  } catch (e) {
    console.error("blog SSR fetch failed (client will retry):", e);
  }

  return (
    <AdminChrome userName={user.name} token={token} viaUrl={viaUrl}>
      <BlogManager authorDefault={user.name} initial={initial} />
    </AdminChrome>
  );
}
