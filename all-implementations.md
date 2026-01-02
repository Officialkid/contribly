# Contribly End-to-End Assessment

## What Works Today
- **Landing → Auth → Org dashboards**: Marketing site renders with CTA links to login/register; protected org routes wrap in modern dashboard shell (sidebar + top nav) via `app/orgs/[orgId]/layout.tsx` and `components/layouts/dashboard-layout.tsx`. Authenticated users can switch orgs/departments in-context.
- **API surface**: Core Express server boots with Prisma and exposes health, workspace, and contribution endpoints (`apps/api/src/index.ts`). CORS/json middleware configured; tenant context inferred from headers; basic error handler in place.
- **TypeScript/build health**: Monorepo type-check passes; API tsconfig targets ES2022 NodeNext with Node types resolved; Next.js build succeeds.
- **Invite/Org context fixes (recent)**: Cookies and invite routes mounted; `/api/auth/me` enriches role/dept; frontend org context reset on logout; dashboard empty states added to avoid infinite spinners.

## Gaps / Broken Flows Observed
- **No automated E2E coverage**: No Playwright/Cypress flows to validate landing→auth→dashboard→payments/claims happy paths or invite acceptance.
- **Auth robustness**: Google OAuth is configured but lacks visible UI triggers on landing/login; username/password registration page was removed; no MFA/password reset flows.
- **Tenant security**: Current `apps/api/src/index.ts` trusts `x-workspace-id`/`x-user-id` headers—suitable only for demos; lacks JWT/session verification and role-based guards on routes.
- **Data validation**: Contributions/workspaces endpoints accept arbitrary payloads without schema validation (no Zod/Joi), increasing risk of bad data.
- **Error/empty states**: Landing and dashboard lack global error boundary/toast surfacing for API failures; payments/claims pages show empty state only when org missing, not when fetch fails.
- **UI polish**: Landing page is visually rich but dashboard still uses mixed styles (modern shell but legacy dark sidebar remains referenced in docs and could resurface if used). Charts/metrics are static placeholders; no loading skeletons for key tables; typography sticks to default stack.
- **Accessibility/i18n**: No explicit a11y audit (focus traps on mobile drawer, aria labels on icons, skip links); single-language copy only.
- **Testing & QA**: No unit/integration tests for API routes or org-context hooks; no mock data seed for staging demos.

## Recommendations (Critical → Minor)
1. **Harden auth & tenancy (Critical)**
   - Enforce JWT/cookie auth middleware on API routes; drop reliance on `x-user-id`/`x-workspace-id` headers.
   - Add role guards for payments/claims creation/approval; deny by default.
   - Surface Google login button on landing/login; add fallback email/password or magic-link if required.
2. **Add validation & observability (High)**
   - Introduce request schemas (Zod) for contributions, workspaces, invites; respond with 400 on invalid input.
   - Add centralized error handler with structured logging (request id, user/org context); propagate user-friendly messages to UI toasts.
3. **Ship E2E coverage (High)**
   - Add Playwright suite: landing loads, login via mock auth, invite accept, org switch, payments/claims read, logout. Gate PRs in CI.
4. **Protect data access (High)**
   - In Prisma queries, always scope by tenant from verified token; add row-level checks for membership/role.
5. **Dashboard UX parity (Medium)**
   - Remove any remaining references/usages of legacy `components/sidebar.tsx`; ensure all org pages use the modern `DashboardLayout` shell.
   - Add loading skeletons for dashboard stats/payments/claims; add retry states for fetch errors.
   - Replace placeholder stats with live aggregates; wire notifications badge to real data or hide.
6. **UI polish (Medium)**
   - Upgrade typography to a purposeful pair (e.g., Sora + Space Grotesk); add consistent spacing/containers in dashboard cards.
   - Add light motion on sidebar toggle and section reveals; ensure mobile drawer focus trap and ESC close.
7. **Accessibility & internationalization (Low)**
   - Add aria-labels to icon-only buttons; ensure color contrast on primary/accent backgrounds.
   - Introduce locale scaffold for key strings; at least centralize copy for future i18n.
8. **Product completeness (Low)**
   - Reintroduce a minimal registration path (if required) or clearly gate to Google auth only.
   - Add profile/preferences page for email, password (if applicable), and notification settings.

## Suggested Test Plan
- **Happy path**: Land → Login (Google or email) → Org selector → Dashboard data visible → Payments list → Claims list → Logout.
- **Edge cases**: Invalid invite code; expired session on dashboard reload; org-less user sees guided empty state; unauthorized member blocked from payments/claims mutations.
- **API**: 401/403 checks on protected endpoints; payload validation rejects malformed data; CORS preflight succeeds from web origin.
- **Cross-browser/device**: Chrome/Firefox/Safari + mobile viewport for sidebar/drawer behavior.

## Current Status
- Builds pass; dashboard shell and org-context are aligned; invites wired. Remaining work is primarily auth hardening, validation, and UX polish before customer-facing rollout.
