import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { getAdminUserFromRequest } from "@/lib/auth";
import { getSettings, type SiteSettings } from "@/lib/settings";

const settingsSchema = z.object({
  announcement: z.object({ enabled: z.boolean(), text: z.string().trim().max(300) }),
  hero: z.object({
    eyebrow: z.string().trim().max(120),
    titleA: z.string().trim().min(1).max(40),
    titleB: z.string().trim().min(1).max(40),
    titleC: z.string().trim().min(1).max(40),
    subtitle: z.string().trim().max(500),
  }),
  about: z.object({
    heading: z.string().trim().min(2).max(160),
    paragraphs: z.array(z.string().trim().min(1).max(1000)).max(6),
    bullets: z.array(z.string().trim().min(1).max(200)).max(8),
  }),
  contact: z.object({
    email: z.string().trim().email().max(160),
    phone: z.string().trim().min(5).max(60),
    whatsapp: z.string().trim().min(5).max(60),
    address: z.string().trim().min(5).max(200),
    hours: z.string().trim().min(2).max(120),
  }),
  social: z.object({
    instagram: z.string().trim().max(300),
    facebook: z.string().trim().max(300),
    tripadvisor: z.string().trim().max(300),
  }),
  images: z.object({
    hero: z.string().trim().min(1).max(500).refine((v) => v.startsWith("/") || v.startsWith("https://")),
    about: z.string().trim().min(1).max(500).refine((v) => v.startsWith("/") || v.startsWith("https://")),
    permit: z.string().trim().min(1).max(500).refine((v) => v.startsWith("/") || v.startsWith("https://")),
    cta: z.string().trim().min(1).max(500).refine((v) => v.startsWith("/") || v.startsWith("https://")),
  }),
});

export async function GET(req: Request) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: Request) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings payload." }, { status: 422 });

  const entries = Object.entries(parsed.data) as [keyof SiteSettings, Record<string, unknown>][];
  try {
    await db.transaction(async (tx) => {
      for (const [key, value] of entries) {
        await tx
          .insert(siteSettings)
          .values({ key, value, updatedAt: new Date() })
          .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
      }
    });
    return NextResponse.json({ ok: true, settings: parsed.data });
  } catch (e) {
    console.error("[admin/settings] save failed:", e);
    return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  }
}
