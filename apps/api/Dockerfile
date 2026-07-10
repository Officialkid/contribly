FROM node:20-bookworm-slim AS base
WORKDIR /workspace
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM deps AS dev
COPY . .
RUN chmod +x scripts/docker/api-dev.sh
CMD ["./scripts/docker/api-dev.sh"]

FROM deps AS build
COPY . .
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
RUN npm run build --workspace apps/api
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build /workspace/packages/database/prisma ./packages/database/prisma
COPY --from=build /workspace/scripts/docker/api-start.sh ./scripts/docker/api-start.sh
RUN chmod +x ./scripts/docker/api-start.sh
EXPOSE 3001
CMD ["./scripts/docker/api-start.sh"]
