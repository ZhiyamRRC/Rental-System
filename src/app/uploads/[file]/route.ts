import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/uploads";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

export const dynamic = "force-dynamic";

/**
 * Serves admin-uploaded media from `public/uploads`.
 *
 * Files that existed when the app was built are served by Next's static layer
 * and never reach this route. Files uploaded afterwards are served here, so
 * new images appear immediately without a rebuild. Either way the folder and
 * the public URL (/uploads/<file>) are identical, and next/image can optimize
 * both.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;

  // Strict filename guard — no traversal, images only
  if (!/^[a-z0-9-]+\.(jpe?g|png|webp|avif|gif)$/i.test(file)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ext = file.split(".").pop()!.toLowerCase();
  const full = path.join(UPLOAD_DIR, file);
  if (!full.startsWith(UPLOAD_DIR)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(full);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
