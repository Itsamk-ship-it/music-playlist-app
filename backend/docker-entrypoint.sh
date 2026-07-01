#!/bin/sh
set -e

echo "[entrypoint] applying database schema..."
# db push creates the schema without needing a migration history — ideal for demo.
npx prisma db push --accept-data-loss --skip-generate

if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] seeding database..."
  npx tsx prisma/seed.ts || echo "[entrypoint] seed skipped/failed (continuing)"
fi

echo "[entrypoint] starting API..."
exec node dist/server.js
