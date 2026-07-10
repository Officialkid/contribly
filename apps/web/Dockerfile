FROM node:20-bookworm-slim AS base
WORKDIR /workspace
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci

FROM deps AS dev
COPY . .
RUN chmod +x scripts/docker/web-dev.sh
CMD ["./scripts/docker/web-dev.sh"]

FROM deps AS build
COPY . .
RUN npm run build --workspace apps/web
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/web/.next ./apps/web/.next
COPY --from=build /workspace/apps/web/public ./apps/web/public
COPY --from=build /workspace/apps/web/package.json ./apps/web/package.json
COPY --from=build /workspace/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=build /workspace/scripts/docker/web-start.sh ./scripts/docker/web-start.sh
RUN chmod +x ./scripts/docker/web-start.sh
EXPOSE 3000
CMD ["./scripts/docker/web-start.sh"]
