#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { REQUIRED_PUBLIC_IMAGES, verifyPublicAssets } = require("./verify-public-assets");

const output = path.resolve(process.argv[2] || "bike-rental-hostinger.zip");
const relativeOutput = path.relative(process.cwd(), output).replaceAll(path.sep, "/");

try {
  verifyPublicAssets();
} catch (error) {
  console.error(`[zip] ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

try {
  fs.rmSync(output, { force: true });
} catch (error) {
  console.error(`[zip] Cannot remove old archive: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

const exclusions = [
  "node_modules/*",
  ".next/*",
  ".git/*",
  ".env",
  ".env.local",
  ".env.*.local",
  "*.log",
  relativeOutput,
  "public/uploads/*",
  "uploads/*",
  "tmp-shots/*",
];

const zip = spawnSync(
  "zip",
  ["-rq", output, ".", "-x", ...exclusions],
  { cwd: process.cwd(), stdio: "inherit" },
);
if (zip.status !== 0) {
  console.error("[zip] The `zip` command failed. Install zip and run this script again.");
  process.exit(zip.status ?? 1);
}

// Runtime upload media is excluded, but keep its directory in a fresh deploy.
const marker = spawnSync("zip", ["-q", output, "public/uploads/.gitkeep"], {
  cwd: process.cwd(),
  stdio: "inherit",
});
if (marker.status !== 0) process.exit(marker.status ?? 1);

const listing = spawnSync("unzip", ["-Z1", output], { encoding: "utf8" });
if (listing.status !== 0) {
  console.error("[zip] Could not inspect the generated archive.");
  process.exit(listing.status ?? 1);
}
const files = new Set(listing.stdout.split("\n").filter(Boolean));
const missing = REQUIRED_PUBLIC_IMAGES
  .map((name) => `public/${name}`)
  .filter((name) => !files.has(name));
if (!files.has("public/uploads/.gitkeep")) missing.push("public/uploads/.gitkeep");
if (missing.length) {
  console.error(`[zip] Archive is incomplete. Missing:\n  - ${missing.join("\n  - ")}`);
  process.exit(1);
}

const sizeMb = (fs.statSync(output).size / 1024 / 1024).toFixed(1);
console.log(`[zip] Created ${path.relative(process.cwd(), output)} (${sizeMb} MB)`);
console.log(`[zip] Verified ${REQUIRED_PUBLIC_IMAGES.length} default images in public/img + public/uploads/.gitkeep`);
console.log("[zip] Secrets (.env/.env.local), build output and runtime uploads were excluded.");
