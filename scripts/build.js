#!/usr/bin/env node
/**
 * Build wrapper: Turbopack by default, Webpack for resource-constrained hosts.
 *
 * Hostinger (and similar shared/cPanel Node builders with tight RAM/process
 * limits) kill Turbopack's PostCSS worker pool, which panics with:
 *   "Failed to write app endpoint … creating new process — node process exited"
 * Webpack runs the CSS pipeline in-process instead, so it survives there.
 *
 * To build with Webpack set either (both are read from .env automatically):
 *   NEXT_BUILD_BUNDLER=webpack       in .env / hosting env vars
 * or run locally:
 *   npm run build -- --webpack       (forwarded straight through)
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { verifyPublicAssets } = require("./verify-public-assets");

// Load .env the same way hosts do — before anything else.
for (const name of [".env.local", ".env"]) {
  const file = path.join(process.cwd(), name);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*))\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2] ?? m[3] ?? (m[4] ?? "").trim();
  }
}

// Refuse to build an incomplete deployment archive. Fresh installs depend on
// the default bike/home images under public/img.
try {
  verifyPublicAssets();
} catch (error) {
  console.error(`[build] ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const bundler =
  process.env.NEXT_BUILD_BUNDLER?.trim().toLowerCase() ||
  (args.includes("--webpack") || args.includes("--turbo") || args.includes("--turbopack") ? null : null);

const forward = [...args];
if (bundler === "webpack" && !forward.includes("--webpack")) {
  forward.push("--webpack");
  console.log("[build] NEXT_BUILD_BUNDLER=webpack → building with Webpack (host-safe mode)");
}

const nextBin = require.resolve("next/dist/bin/next");
const result = spawnSync(process.execPath, [nextBin, "build", ...forward], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
