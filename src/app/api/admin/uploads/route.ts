import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { getAdminUserFromRequest } from "@/lib/auth";
import { UPLOAD_DIR, uploadUrl } from "@/lib/uploads";
import { rateLimit, rateLimitHeaders, requestIp } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
// Files are stored in public/uploads (see src/lib/uploads.ts).

/**
 * Admin image upload. Saves the file into `public/uploads` — alongside the
 * default images in `public/img` — and returns its public `/uploads/...` URL.
 */
export async function POST(req: Request) {
  const user = await getAdminUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limiter = rateLimit(`upload:${user.id}:${requestIp(req)}`, 60, 60 * 60_000);
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a while and try again." },
      { status: 429, headers: rateLimitHeaders(limiter) },
    );
  }

  let data: FormData;
  try {
    data = await req.formData();
  } catch {
    return NextResponse.json({ error: "Send the image as multipart form-data." }, { status: 400 });
  }

  const file = data.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach the image in a 'file' field." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The file is empty." }, { status: 422 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Images must be 8 MB or smaller." }, { status: 413 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WebP, AVIF or GIF images are allowed." },
      { status: 415 },
    );
  }

  try {
    const original = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
    const filename = `${original}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: uploadUrl(filename), fileName: file.name }, { status: 201 });
  } catch (e) {
    console.error("[admin/uploads] save failed:", e);
    return NextResponse.json(
      { error: "Could not save the image. Check the server can write to public/uploads." },
      { status: 500 },
    );
  }
}
