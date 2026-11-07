import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { getAdminUserFromRequest } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { postSchema } from "@/lib/schemas";

function numericId(raw: string) {
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = numericId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = postSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid post data." }, { status: 422 });

  try {
    const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    const { slug, ...rest } = parsed.data;
    const update: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (slug?.trim()) {
      const clean = slugify(slug);
      if (!clean) return NextResponse.json({ error: "Slug cannot be empty." }, { status: 422 });
      update.slug = clean;
    }
    if (parsed.data.published === true && !existing.published) update.publishedAt = new Date();

    await db.update(blogPosts).set(update).where(eq(blogPosts.id, id));
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    return NextResponse.json({ post });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ error: "That post URL is already in use. Choose a different slug." }, { status: 409 });
    }
    console.error("[admin/blog] update failed:", e);
    return NextResponse.json({ error: "Could not update the post." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = numericId((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });

  try {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    if (result[0].affectedRows === 0) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/blog] delete failed:", e);
    return NextResponse.json({ error: "Could not delete the post." }, { status: 500 });
  }
}
