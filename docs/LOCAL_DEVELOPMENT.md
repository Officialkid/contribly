# Local Development

Contribly supports two local workflows:

- `Docker`: the most consistent cross-platform option, especially on machines that hit file-watcher issues.
- `Native`: faster iteration if your host environment is already set up and stable.

Both workflows now target a Neon Postgres branch. The application runtime should use Neon's pooled connection string in `DATABASE_URL`, while Prisma migrations should use the direct connection string in `DIRECT_URL`.

## Docker Quickstart

1. Copy the environment templates:

```bash
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

2. Fill in the required secrets in `apps/api/.env.local`.
   Use a Neon development branch for both Docker and native development.
   Set:
   `DATABASE_URL` = pooled Neon connection string
   `DIRECT_URL` = direct Neon connection string

3. Start the full stack:

```bash
docker compose up --build
```

This starts:

- API on `http://localhost:3001`
- Web on `http://localhost:3000`

The API container runs Prisma client generation and `prisma migrate deploy` automatically before starting, using `DIRECT_URL` for migrations through Prisma's datasource config.
The web container uses `NEXT_PUBLIC_API_URL=http://localhost:3001` for the browser and `API_SERVER_URL=http://api:3001` for container-to-container calls on the compose network.

### Production API Image

- `apps/api/Dockerfile` is the production-realistic API image definition.
- Local Compose uses its `dev` target for hot reload.
- Cloud Run / production-style builds should use the `production` target from the same Dockerfile, for example:

```bash
docker build -f apps/api/Dockerfile --target production -t contribly-api .
```

## Native Quickstart

1. Install dependencies from the repo root:

```bash
npm install
```

2. Prepare local env files.

```bash
npm run dev
```

This will create `apps/api/.env.local` and `apps/web/.env.local` from the examples if they do not exist yet, then stop so you can review them.

3. Fill in the values you need in `apps/api/.env.local`.
   Recommended setup:
   `DATABASE_URL` = pooled Neon branch URL
   `DIRECT_URL` = direct Neon branch URL

4. Verify the database target and bootstrap Prisma from the canonical API env:

```bash
npm run db:doctor
npm run db:setup
```

These commands intentionally ignore conflicting `DATABASE_URL` values in root `.env` or `packages/database/.env.local` and use `apps/api/.env.local`.
`db:setup` will run migrations against `DIRECT_URL`, which should be the direct Neon connection string for your dev branch.

5. Start the applications:

```bash
npm run dev
```

The root `npm run dev` command now:

- checks that `apps/api/.env.local` and `apps/web/.env.local` exist
- warns if root `.env` or `packages/database/.env.local` point at a different database than `apps/api/.env.local`
- fails fast if ports `3000` or `3001` are already taken
- starts both `web` and `api` through the monorepo

## Native DB Rules

- Use `apps/api/.env.local` as the canonical native-development database config.
- Use a Neon dev branch rather than a laptop-hosted Postgres instance so local, container, and deployed environments all share the same engine behavior.
- Root `.env` may still exist for other tooling, but native dev and native Prisma scripts should not rely on it.
- `packages/database/.env.local` is legacy for native dev. If it disagrees with `apps/api/.env.local`, the local scripts will warn and still use `apps/api/.env.local`.

## Known Docker Caveats

- If you change `packages/database/prisma/schema.prisma`, restart the API container so Prisma regenerates inside Linux and stays aligned with the container runtime.
- The Docker flow uses bind mounts for source code and named volumes for dependencies, so the first startup may take longer while packages are installed into the container volume.
- `NEXT_PUBLIC_API_URL` should be the API origin, not the `/api` path. Use `http://localhost:3001`, not `http://localhost:3001/api`.
- The API production image expects runtime env such as `PORT`, `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and mail/OAuth secrets to be injected by the platform. Do not bake them into the image.
- For Neon, use the pooled URL in `DATABASE_URL` and the unpooled direct URL in `DIRECT_URL`.

## Security And Secrets

- Keep real local secrets only in `apps/api/.env.local`, `apps/web/.env.local`, and `apps/api/.env.test` for test-only setup.
- Do not commit `.env`, `.env.local`, `.env.production`, `.env.test`, or database-specific env files. Commit only example templates such as `apps/api/.env.example`, `apps/api/.env.test.example`, and `apps/web/.env.example`.
- Native local development uses `apps/api/.env.local` as the canonical backend env source. Root `.env` and `packages/database/.env.local` are legacy-only surfaces and should not hold your active development secrets.
- Run `npm run secrets:scan` before pushing if you want a manual check. A git pre-commit hook is also installed automatically by `npm install` through the repo `prepare` script.
- If a secret was ever committed to git history, treat it as compromised and rotate it in every live system that uses it.

## Test Env Convention

- Create `apps/api/.env.test` from `apps/api/.env.test.example` only on your machine.
- Use a separate test database in `TEST_DATABASE_URL`.
- Never commit `apps/api/.env.test`, even if it only points at localhost, because test secrets and JWT values still become part of repo history once tracked.
