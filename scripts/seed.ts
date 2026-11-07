import "dotenv/config";
import { pool } from "../src/db";
import { ensureDatabase } from "../src/lib/bootstrap";

async function main() {
  await ensureDatabase();
  console.log("Bootstrap complete (schema ensured, gaps seeded).");
  await pool.end();
}

main().catch(async (e) => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
