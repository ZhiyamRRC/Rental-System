import path from "node:path";

/**
 * Uploaded media lives inside the public folder, next to the default site
 * images:
 *
 *   public/img/      → default images shipped with the project
 *   public/uploads/  → images uploaded through the admin panel
 *
 * Note: `next start` serves `public/` from a manifest captured at BUILD time,
 * so a file uploaded after the build is not picked up by the static layer.
 * The app therefore also serves this folder itself via `/uploads/[file]`,
 * which makes uploads visible immediately without a rebuild. Files added
 * before a build are served statically; everything else by the route. Both
 * resolve to the same public/uploads directory and the same public URL.
 *
 * Override with UPLOADS_DIR if your host needs a different persistent path.
 */
export const UPLOAD_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(process.cwd(), "public", "uploads");

/** Public URL for a stored upload filename. */
export function uploadUrl(fileName: string) {
  return `/uploads/${fileName}`;
}
