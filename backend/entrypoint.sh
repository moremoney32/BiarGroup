#!/bin/sh
set -e

echo "▶ Running database migrations..."
node dist/db/migrations/run-migrations.js

echo "▶ Starting BIAR backend..."
exec node dist/server.js
