#!/bin/sh
set -eu

cd /workspace

if [ ! -x node_modules/.bin/next ]; then
  npm install
fi

exec npm run dev --workspace apps/web -- --hostname 0.0.0.0
