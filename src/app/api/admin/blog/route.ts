import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { getAdminUserFromRequest } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { postSchema } from "@/lib/schemas";

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}

export async function GET(req: Request) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
    return NextResponse.json({ posts });
  } catch (e) {
    console.error("[admin/blog] list failed:", e);
    return NextResponse.json({ error: "Could not load blog posts." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete the title, content, author, and category correctly." }, { status: 422 });
  }

  const base = parsed.data.slug?.trim() ? slugify(parsed.data.slug) : slugify(parsed.data.title);
  const slug = `${base || "post"}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    const now = new Date();
    const [{ id }] = await db
      .insert(blogPosts)
      .values({ ...parsed.data, slug, updatedAt: now, publishedAt: now })
      .$returningId();
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ error: "That post URL is already in use. Choose a different slug." }, { status: 409 });
    }
    console.error("[admin/blog] create failed:", e);
    return NextResponse.json({ error: "Could not save the post." }, { status: 500 });
  }
}
