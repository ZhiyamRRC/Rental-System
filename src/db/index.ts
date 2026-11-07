import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool, type PoolOptions } from "mysql2/promise";

const MYSQL_PROTOCOLS = ["mysql:", "mariadb:"];

function fromUrl(raw: string): PoolOptions | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!MYSQL_PROTOCOLS.includes(url.protocol)) return null;
  const database = url.pathname.replace(/^\//, "");
  if (!url.hostname || !url.username || !database) return null;
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

/**
 * Resolution order (first match wins):
 *   1. MYSQL_URL          — MySQL-specific, immune to DATABASE_URL being
 *                           overwritten with a Postgres URL by the host.
 *   2. DB_HOST/DB_NAME/DB_USER (+ DB_PORT, DB_PASSWORD) — granular variables.
 *   3. DATABASE_URL       — used only when it is a mysql:// or mariadb:// URL.
 *
 * If none match we fall back to a local MySQL default and warn loudly, rather
 * than throwing at import time: a hard throw here fails the whole production
 * build, whereas pages already degrade gracefully when a query fails.
 */
function resolveTarget(): { options: PoolOptions; source: string } {
  if (process.env.MYSQL_URL) {
    const options = fromUrl(process.env.MYSQL_URL);
    if (options) return { options, source: "MYSQL_URL" };
    console.warn("[db] MYSQL_URL is set but is not a valid mysql:// URL — ignoring it.");
  }

  const { DB_HOST, DB_NAME, DB_USER, DB_PORT, DB_PASSWORD } = process.env;
  if (DB_HOST && DB_NAME && DB_USER) {
    return {
      source: "DB_HOST/DB_NAME/DB_USER",
      options: {
        host: DB_HOST,
        port: Number(DB_PORT ?? "3306"),
        user: DB_USER,
        password: DB_PASSWORD ?? "",
        database: DB_NAME,
      },
    };
  }

  if (process.env.DATABASE_URL) {
    const options = fromUrl(process.env.DATABASE_URL);
    if (options) return { options, source: "DATABASE_URL" };
    console.warn(
      "[db] DATABASE_URL is not a MySQL URL (this app uses MySQL). " +
        "Set MYSQL_URL, or DB_HOST + DB_NAME + DB_USER, to point at your MySQL server.",
    );
  }

  console.warn("[db] No MySQL configuration found — falling back to mysql://root@127.0.0.1:3306/app_db");
  return {
    source: "fallback",
    options: { host: "127.0.0.1", port: 3306, user: "root", password: "root", database: "app_db" },
  };
}

function connectionOptions(): PoolOptions {
  const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT ?? "10");
  const { options, source } = resolveTarget();
  if (process.env.NODE_ENV !== "production") {
    console.info(`[db] MySQL configured from ${source} → ${options.host}:${options.port}/${options.database}`);
  }
  return {
    ...options,
    connectionLimit: Number.isInteger(connectionLimit) && connectionLimit > 0 ? connectionLimit : 10,
    multipleStatements: true, // required for idempotent bootstrap DDL batches
    timezone: "Z", // persist and read timestamps in UTC
    ssl: process.env.DB_SSL === "true" ? {} : undefined,
  };
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsMysqlPool?: Pool;
};

export const pool = globalForDb.__arenaNextJsMysqlPool ?? createPool(connectionOptions());

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsMysqlPool = pool;
}

export const db = drizzle(pool);
