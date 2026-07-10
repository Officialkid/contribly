# Deployment Guide: Cloud Run + Vercel

Date: 2026-07-10

## Target Setup

- `apps/api` deploys to Google Cloud Run from GitHub Actions
- `apps/web` deploys to Vercel
- PostgreSQL runs on Neon

Current target frontend URL:

- `https://contribly-web.vercel.app/`

## GCP Prerequisites

Create or confirm a dedicated GCP project for Contribly and enable:

- Cloud Run API
- Artifact Registry API
- Secret Manager API
- IAM Credentials API

Create:

1. an Artifact Registry Docker repository
2. a deployment service account
3. a Workload Identity Pool and Provider for this GitHub repo

Recommended service-account roles:

- `roles/run.admin`
- `roles/artifactregistry.writer`
- `roles/iam.serviceAccountUser`
- `roles/secretmanager.secretAccessor`

## GitHub Configuration

Add these GitHub repository secrets:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT_EMAIL`

Add these GitHub repository variables:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GAR_REPOSITORY`
- `CLOUD_RUN_SERVICE`
- `CLOUD_RUN_MIGRATION_JOB`
- `CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT`
- `FRONTEND_URL`
- `CORS_ORIGIN`
- `CORS_ORIGIN_REGEX`
- `GOOGLE_CALLBACK_URL`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Notes:

- `FRONTEND_URL` should be the Vercel production URL or custom app domain, e.g. `https://app.contribly.app`
- `CORS_ORIGIN` can be a comma-separated allowlist of exact origins
- `CORS_ORIGIN_REGEX` can be used for Vercel previews, for example:
  `^https://contribly-web-.*\.vercel\.app$`

## Secret Manager Secrets

Create these Secret Manager entries for the API:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

Runtime rule:

- `DATABASE_URL` = Neon pooled connection string
- `DIRECT_URL` = Neon direct connection string

## Workflow Behavior

The GitHub Actions workflow at `.github/workflows/deploy-api.yml` does this on pushes to `main` when API-relevant files change:

1. authenticates to GCP using Workload Identity Federation
2. builds the production API Docker image
3. pushes it to Artifact Registry
4. deploys or updates a Cloud Run Job for migrations
5. runs `prisma migrate deploy` against `DIRECT_URL`
6. deploys the API service to Cloud Run
7. smoke-tests `/health`

## Vercel Setup

Connect this repo to Vercel and set:

- Project root: `apps/web`
- Framework preset: Next.js

Add Vercel environment variables:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `API_SERVER_URL` only if you intentionally want a server-side override in Vercel

If using the GitHub Actions workflow for Vercel, also add this GitHub secret:

- `VERCEL_TOKEN`

Recommended:

- current production web URL: `https://contribly-web.vercel.app/`
- production API domain: `api.contribly.app`

The frontend deployment workflow is at `.github/workflows/deploy-web.yml`.
It deploys preview builds on pull requests and production builds on pushes to `main`, scoped to web-relevant changes only.

## OAuth + CORS

Update the Google OAuth client to include:

- `http://localhost:3001/api/auth/google/callback`
- the Cloud Run or custom API callback URL, e.g. `https://api.contribly.app/api/auth/google/callback`

Set:

- `FRONTEND_URL` to `https://contribly-web.vercel.app`
- `CORS_ORIGIN` to any additional exact web origins
- `CORS_ORIGIN_REGEX` if preview deployments should access the real API, for example:
  `^https://contribly-web-.*\.vercel\.app$`

If previews should not hit production data, leave preview domains out of the CORS config and point previews at a staging API instead.

## Remaining Manual Verification

After setup, verify end to end:

1. OAuth login
2. payment recording
3. withdrawal request and OTP approval
4. payment claim approval
5. `/health` on the live Cloud Run service

## Git Push Note

This local repository currently has no configured Git remote, so GitHub Actions cannot run until you:

1. create or choose the GitHub repository
2. add it as `origin`
3. push the branch that contains these workflow files
