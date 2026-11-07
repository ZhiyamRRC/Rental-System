#!/usr/bin/env node
/**
 * Blocks until MySQL accepts connections, so the container does not start the
 * web server (or run migrations) against a database that is still booting.
 *
 * Resolution order matches src/db/index.ts:
 *   MYSQL_URL → DB_HOST/DB_NAME/DB_USER (+DB_PORT/DB_PASSWORD) → DATABASE_URL (mysql only)
 */
const mysql = require("mysql2/promise");

const MYSQL_PROTOCOLS = ["mysql:", "mariadb:"];

function fromUrl(raw) {
  if (!raw) return null;
  let url;
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

function resolveTarget() {
  const fromMysqlUrl = fromUrl(process.env.MYSQL_URL);
  if (fromMysqlUrl) return fromMysqlUrl;

  const { DB_HOST, DB_NAME, DB_USER, DB_PORT, DB_PASSWORD } = process.env;
  if (DB_HOST && DB_NAME && DB_USER) {
    return {
      host: DB_HOST,
      port: Number(DB_PORT || "3306"),
      user: DB_USER,
      password: DB_PASSWORD || "",
      database: DB_NAME,
    };
  }

  const fromDatabaseUrl = fromUrl(process.env.DATABASE_URL);
  if (fromDatabaseUrl) return fromDatabaseUrl;

  throw new Error(
    "No MySQL configuration found. Set MYSQL_URL, or DB_HOST + DB_NAME + DB_USER (+ optional DB_PORT/DB_PASSWORD).",
  );
}

async function main() {
  const target = resolveTarget();
  const attempts = Number(process.env.DB_WAIT_ATTEMPTS || "60");
  const delayMs = Number(process.env.DB_WAIT_DELAY_MS || "2000");

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const connection = await mysql.createConnection({
        ...target,
        connectTimeout: 5000,
        ssl: process.env.DB_SSL === "true" ? {} : undefined,
      });
      await connection.query("select 1");
      await connection.end();
      console.log(`[wait-for-db] ${target.host}:${target.port}/${target.database} is ready`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === attempts) {
        console.error(`[wait-for-db] database never became ready: ${message}`);
        process.exit(1);
      }
      if (attempt === 1 || attempt % 5 === 0) {
        console.log(`[wait-for-db] attempt ${attempt}/${attempts} — ${message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

main().catch((error) => {
  console.error(`[wait-for-db] ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
