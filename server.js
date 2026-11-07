/**
 * Production server entry for Node-capable shared hosting (cPanel "Setup
 * Node.js Application", CloudLinux Node Selector, Passenger, PM2).
 *
 * Hosts hand you a port via the PORT env var (sometimes a UNIX socket path) and
 * expect a plain Node file as the "Application startup file". This boots the
 * production Next.js server on exactly that address.
 */
const { createServer } = require("node:http");
const next = require("next");
const { verifyPublicAssets } = require("./scripts/verify-public-assets");

const dev = false;

try {
  verifyPublicAssets();
} catch (error) {
  console.error(`[startup] ${error instanceof Error ? error.message : error}`);
  process.exit(1);
}

// Passenger/cPanel export PORT (number or /path/to/socket). Hosting panels may
// also set HOST/HOSTNAME. We honour all of them.
const rawPort = process.env.PORT;
const isSocket = rawPort && isNaN(Number(rawPort));
const port = isSocket ? rawPort : Number(rawPort || 3000);
const hostname = process.env.HOSTNAME || process.env.HOST || (isSocket ? undefined : "0.0.0.0");

const app = next({ dev, hostname: isSocket ? "localhost" : hostname, port: isSocket ? 0 : port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer(async (req, res) => {
      try {
        await handle(req, res);
      } catch (err) {
        console.error("Request failed:", err);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });
    server.listen(port, ...(isSocket ? [] : [hostname]), () => {
      console.log(`Ceylon Ride Co. ready on ${isSocket ? `socket ${port}` : `${hostname}:${port}`}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
