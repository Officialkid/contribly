# Neon Migration Checklist

Date: 2026-07-10

## Decision

Contribly stays on PostgreSQL and moves from laptop or container-hosted Postgres to Neon-managed Postgres.

- `DATABASE_URL`: Neon pooled runtime connection string
- `DIRECT_URL`: Neon direct connection string for Prisma migrations

## Repo Changes Already Made

- Prisma datasource now supports both `url` and `directUrl`.
- Local env templates include `DATABASE_URL` and `DIRECT_URL`.
- Native local development now assumes a Neon development branch.
- Docker Compose no longer starts a local Postgres container and instead expects Neon-backed env values.
- Render config now expects Neon URLs to be supplied manually.

## Manual Provisioning Steps

1. Create a dedicated Neon project for Contribly.
2. Create at least two branches:
   - `main` or production branch
   - `dev` branch for local development and QA
3. Copy the Neon pooled connection string into `DATABASE_URL`.
4. Copy the Neon direct connection string into `DIRECT_URL`.

## Local Setup

1. Copy:
   - `apps/api/.env.example` -> `apps/api/.env.local`
   - `apps/web/.env.example` -> `apps/web/.env.local`
2. Set `DATABASE_URL` to the pooled Neon branch URL.
3. Set `DIRECT_URL` to the direct Neon branch URL.
4. Run:

```bash
npm run db:doctor
npm run db:setup
```

5. Start the stack with either:

```bash
npm run dev
```

or

```bash
docker compose up --build
```

## Deployment Notes

For production deployment, inject:

- `DATABASE_URL` = Neon pooled production URL
- `DIRECT_URL` = Neon direct production URL

If deploying to Cloud Run, store both in Secret Manager and make them available to the service at runtime. Run `prisma migrate deploy` against `DIRECT_URL` before routing traffic to a new revision.

## Current Repo Limitation

There is no checked-in GitHub Actions workflow in this repository right now, so there was no deploy pipeline file available to update for Neon migration execution. If a CI or deploy workflow exists outside this repo, it should be updated to:

1. load `DATABASE_URL` and `DIRECT_URL`
2. run `npx prisma migrate deploy`
3. deploy the application only after migrations succeed

## Verification Still Required

These checks still need to be run against a real Neon environment:

1. `prisma migrate deploy` on a fresh Neon database
2. optional seed load, if seed data is introduced
3. payment matching flow
4. claim approval flow
5. withdrawal approval flow
6. a few concurrent requests to confirm pooled runtime behavior is stable
