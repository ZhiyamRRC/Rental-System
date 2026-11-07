#!/bin/sh
# Container entrypoint: wait for MySQL, make sure the schema + starter data
# exist, then hand over to the web server (or whatever CMD was given).
set -eu

echo "[entrypoint] waiting for the database…"
node scripts/wait-for-db.js

if [ "${RUN_DB_INIT:-true}" = "true" ]; then
  echo "[entrypoint] ensuring schema and starter data…"
  # seed.ts -> ensureDatabase(): idempotent CREATE TABLE IF NOT EXISTS + seed.
  # Safe to run on every boot; existing data is never overwritten.
  if ./node_modules/.bin/tsx scripts/seed.ts; then
    echo "[entrypoint] database ready"
  else
    echo "[entrypoint] WARNING: initialisation failed — the app self-heals on first request"
  fi
else
  echo "[entrypoint] RUN_DB_INIT=false — skipping schema/seed step"
fi

echo "[entrypoint] starting: $*"
exec "$@"
