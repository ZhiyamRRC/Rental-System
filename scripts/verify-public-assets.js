#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

/**
 * Default image bundle required by a fresh database/seed.
 * These files MUST ship in every deployment archive under public/img.
 */
const REQUIRED_PUBLIC_IMAGES = [
  "img/hero.jpg",
  "img/about.jpg",
  "img/permit.jpg",
  "img/cta.jpg",
  "img/bikes/pcx.jpg",
  "img/bikes/trail.jpg",
  "img/bikes/scrambler.jpg",
  "img/bikes/adv.jpg",
  "img/bikes/tuktuk.jpg",
  "img/bikes/suv.jpg",
];

const SKIP_PARTS = new Set(["public", "node_modules", ".next", ".git", "out", "_static", "dist"]);

function fileExistsAsFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function ensureUploadsKeep(publicDir) {
  const keep = path.join(publicDir, "uploads", ".gitkeep");
  if (!fileExistsAsFile(keep)) {
    fs.mkdirSync(path.dirname(keep), { recursive: true });
    fs.writeFileSync(keep, "# Keeps public/uploads in the deployment archive; admin uploads land here.\n");
  }
}

/**
 * Locate required images wherever they landed after a wrapper-folder
 * extraction, and copy them into `<root>/public/<rel>` in place.
 * Returns true when everything ended up present.
 */
function autoRepair(rootDir) {
  const patches = [];
  const stack = [{ dir: rootDir, depth: 0 }];
  const total = REQUIRED_PUBLIC_IMAGES.length;

  while (stack.length && patches.length < total) {
    const { dir, depth } = stack.pop() ?? {};
    if (!dir || depth > 5) continue;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (patches.length >= total) break;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_PARTS.has(entry.name) && !entry.name.startsWith(".") && depth < 5) {
          stack.push({ dir: full, depth: depth + 1 });
        }
        continue;
      }
      if (!entry.isFile()) continue;
      const name = entry.name.toLowerCase();
      const rel = path.relative(rootDir, full).replaceAll(path.sep, "/");
      const key = REQUIRED_PUBLIC_IMAGES.find((r) => {
        const leaf = path.posix.basename(r);
        const parent = r === "img/" + leaf ? "" : `${path.posix.basename(path.posix.dirname(r))}/`;
        // Wrapper-friendly match: the file path must end with the expected
        // `img/(bikes/)?<basename>` segment regardless of how it was nested on extraction.
        return name === leaf && rel.endsWith(parent ? `img/${parent}${leaf}` : `img/${leaf}`);
      });
      if (!key) continue;
      const want = path.join(rootDir, "public", key);
      if (full === want) continue; // already in place
      try {
        fs.mkdirSync(path.dirname(want), { recursive: true });
        fs.copyFileSync(full, want);
        patches.push(key);
      } catch (err) {
        console.warn(`[assets] could not copy ${key} → ${want}: ${err.message}`);
      }
    }
  }
  return patches.length === 0 || patches.length <= total;
}

function verifyPublicAssets({ quiet = false } = {}) {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, "public");
  const missing = [];
  const empty = [];

  // auto-repair first: maybe the archive lost/wrapped public
  const firstPass = REQUIRED_PUBLIC_IMAGES.filter((r) => !fileExistsAsFile(path.join(publicDir, r)));
  if (firstPass.length > 0) {
    const before = firstPass.length;
    autoRepair(rootDir);
    const after = REQUIRED_PUBLIC_IMAGES.filter((r) => !fileExistsAsFile(path.join(publicDir, r))).length;
    if (after < before) console.log(`[assets] restored ${before - after} default images into public/`);
  }

  if (!fs.existsSync(publicDir) || !fs.statSync(publicDir).isDirectory()) {
    throw new Error(
      "The public/ folder is missing. Include the complete public folder in the deployment archive (keep the ZIP root as project root).",
    );
  }

  for (const relative of REQUIRED_PUBLIC_IMAGES) {
    const full = path.join(publicDir, relative);
    if (!fileExistsAsFile(full)) {
      missing.push(`public/${relative}`);
      continue;
    }
    if (fs.statSync(full).size === 0) empty.push(`public/${relative}`);
  }

  ensureUploadsKeep(publicDir);

  if (missing.length || empty.length) {
    const lines = [
      "Public asset verification failed.",
      missing.length ? `Missing:\n  - ${missing.join("\n  - ")}` : "",
      empty.length ? `Empty:\n  - ${empty.join("\n  - ")}` : "",
      "Recreate the deployment archive from the PROJECT ROOT (upload `bike-rental-hostinger.zip` and extract in place, not into a wrapper folder).",
    ].filter(Boolean);
    throw new Error(lines.join("\n"));
  }

  if (!quiet) {
    const bytes = REQUIRED_PUBLIC_IMAGES.reduce(
      (sum, relative) => sum + fs.statSync(path.join(publicDir, relative)).size,
      0,
    );
    console.log(
      `[assets] public/ verified: ${REQUIRED_PUBLIC_IMAGES.length} default images + public/uploads (${(
        bytes /
        1024 /
        1024
      ).toFixed(1)} MB)`,
    );
  }

  return true;
}

if (require.main === module) {
  try {
    verifyPublicAssets();
  } catch (error) {
    console.error(`[assets] ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

module.exports = { REQUIRED_PUBLIC_IMAGES, verifyPublicAssets };
