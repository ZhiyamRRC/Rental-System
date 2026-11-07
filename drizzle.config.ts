import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const MYSQL_PROTOCOLS = ["mysql:", "mariadb:"];

function isMysqlUrl(raw: string | undefined): raw is string {
  if (!raw) return false;
  try {
    return MYSQL_PROTOCOLS.includes(new URL(raw).protocol);
  } catch {
    return false;
  }
}

/** Mirrors the runtime resolution order in src/db/index.ts. */
function databaseUrl() {
  if (isMysqlUrl(process.env.MYSQL_URL)) return process.env.MYSQL_URL;

  const { DB_HOST, DB_NAME, DB_USER, DB_PORT, DB_PASSWORD } = process.env;
  if (DB_HOST && DB_NAME && DB_USER) {
    const auth = `${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD ?? "")}`;
    return `mysql://${auth}@${DB_HOST}:${DB_PORT ?? "3306"}/${DB_NAME}`;
  }

  if (isMysqlUrl(process.env.DATABASE_URL)) return process.env.DATABASE_URL;

  throw new Error(
    "No MySQL configuration found. Set MYSQL_URL, or DB_HOST + DB_NAME + DB_USER (+ optional DB_PORT/DB_PASSWORD).",
  );
}

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url: databaseUrl() },
});
