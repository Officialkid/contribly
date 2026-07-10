# Secret Configuration Audit

Date: 2026-07-10

## Summary

The repository was audited for environment-file exposure and secret-handling risk. The repo now blocks common accidental secret commits at the git-hook level and ignores non-template env files by default.

## Env Surfaces Found

- `/.env`
- `/apps/api/.env`
- `/apps/api/.env.local`
- `/apps/api/.env.example`
- `/apps/api/.env.local.example`
- `/apps/api/.env.test.example`
- `/apps/web/.env.local`
- `/apps/web/.env.example`
- `/packages/database/.env.local`
- `/packages/database/.env.example`

The following repo-tracked env files were removed or are now limited to template use only:

- `apps/api/.env.test`
- `apps/web/.env.production`

## Exposure Findings

Historical git inspection showed prior commits containing secret-bearing env files. Exact values are intentionally not repeated here, but the exposed categories included:

- database connection credentials
- Google OAuth client secrets
- SMTP credentials
- object-storage access keys
- test JWT secrets

Because those values existed in git history, they must be treated as compromised even if the files are now ignored.

## Repo Safeguards Added

- `.gitignore` now ignores `.env*` files by default while allowing example templates.
- A pre-commit hook runs `node scripts/secret-scan.mjs --staged`.
- `npm install` configures the repo hook path automatically through the `prepare` script.
- Local-development docs now define the approved secret locations and the test-env convention explicitly.

## Required Manual Follow-Up

These actions cannot be completed safely from inside the repository alone and still require out-of-band execution:

1. Rotate any database credentials present in historical `DATABASE_URL` values.
2. Rotate any `DIRECT_URL` credentials once Neon is introduced for migrations.
3. Rotate `MONGODB_URI` as well if migration work has already introduced a live Mongo connection.
4. Rotate Google OAuth client secrets.
5. Rotate SMTP credentials.
6. Rotate object-storage access keys such as Cloudflare R2 credentials.
7. Update Render, Cloud Run, and any other hosting providers with the rotated values.
8. Replace local developer copies of old env files with newly rotated values through your team secret-sharing process.

## Important Note

The acceptance target "no real secrets exist in any file tracked by git, past or present" is not yet fully achievable from this patch alone because git history already contains prior env commits. Fully meeting that bar would require both:

- rotating every exposed secret
- rewriting repository history if the team decides that is necessary
