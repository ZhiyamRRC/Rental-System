import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { testimonials } from "@/db/schema";
import { rateLimit, rateLimitHeaders, requestIp } from "@/lib/rate-limit";

const reviewSchema = z.object({
  name: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().trim().min(10).max(800),
  bikeName: z.string().trim().max(120).default(""),
});

export async function POST(req: Request) {
  const limiter = rateLimit(`review:${requestIp(req)}`, 8, 60 * 60_000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many reviews submitted. Please try again later." },
      { status: 429, headers: rateLimitHeaders(limiter) },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in every field correctly." }, { status: 422 });
  }

  try {
    await db.insert(testimonials).values({ ...parsed.data, approved: false });
    return NextResponse.json({ ok: true }, { status: 201, headers: rateLimitHeaders(limiter) });
  } catch (e) {
    console.error("[reviews] insert failed:", e);
    return NextResponse.json({ error: "Could not save your review. Please try again." }, { status: 500 });
  }
}
