/**
 * Plain JavaScript config — deliberate.
 *
 * next.config.TS made Next spawn a worker that needed glibc 2.29+, which
 * crashed on Hostinger's older build box with "version `GLIBC_2.29' not found".
 * A plain .js config needs no such worker, so it loads everywhere.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    // Set NEXT_IMAGES_UNOPTIMIZED=true on hosts that cannot run the sharp/sharp
    // native image optimizer.
    unoptimized: process.env.NEXT_IMAGES_UNOPTIMIZED === "true",
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-DNS-Prefetch-Control", value: "off" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    },
    {
      source: "/admin/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
    },
    {
      source: "/api/admin/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
    },
  ],
};

module.exports = nextConfig;
