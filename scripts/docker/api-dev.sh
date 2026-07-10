#!/bin/sh
set -eu

cd /workspace

if [ ! -x node_modules/.bin/tsx ]; then
  npm install
fi

npx prisma generate --schema=packages/database/prisma/schema.prisma
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

exec npm run dev --workspace apps/api
