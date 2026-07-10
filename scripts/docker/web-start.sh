#!/bin/sh
set -eu

cd /app/apps/web

exec npm run start -- --hostname 0.0.0.0 --port "${PORT:-3000}"
