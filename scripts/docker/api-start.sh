#!/bin/sh
set -eu

cd /app/apps/api

exec node dist/index.js
