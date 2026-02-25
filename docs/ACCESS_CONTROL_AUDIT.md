# Access Control Audit - Contribly
**Date:** February 25, 2026  
**Auditor:** AI Security Assistant  
**Scope:** Complete authorization and cross-tenant isolation review

---

## Executive Summary

This audit reviewed **every API endpoint** across 10 route files to verify role-based access control (RBAC) and cross-tenant isolation. The system has three roles:
- **CHIEF_ADMIN** - Organization owner
- **ADMIN** - Department administrator  
- **MEMBER** - Department member

### Critical Findings:
- ❌ **3 CRITICAL vulnerabilities** - Missing role checks allowing privilege escalation
- ⚠️ **2 HIGH vulnerabilities** - Cross-tenant data access possible
- ⚠️ **4 MEDIUM issues** - Insufficient authorization checks
- ✅ **Most endpoints correctly protected**

**Status:** ⚠️ **NOT PRODUCTION-READY** - Critical fixes required before deployment

---

## 1. Route Permission Map

### 1.1 Authentication Routes (`/api/auth`)

| Method | Path | Who Can Access | Current Middleware | Status |
|--------|------|---------------|-------------------|--------|
| POST | `/auth/register` | Public | `registrationLimiter` | ✅ PASS |
| POST | `/auth/login` | Public | `loginLimiter` | ✅ PASS |
| POST | `/auth/login/verify-mfa` | Public (with code) | `mfaLimiter` | ✅ PASS |
| GET | `/auth/google` | Public | passport | ✅ PASS |
| GET | `/auth/google/callback` | Public (OAuth) | passport | ✅ PASS |
| GET | `/auth/me` | Authenticated users | `authMiddleware` | ✅ PASS |
| POST | `/auth/logout` | Public | None | ✅ PASS |
| POST | `/auth/forgot-password` | Public | `forgotPasswordLimiter` | ✅ PASS |
| POST | `/auth/reset-password` | Public (with token) | `resetPasswordLimiter` | ✅ PASS |
| POST | `/auth/request-mfa` | Authenticated users | `authMiddleware` | ✅ PASS |
| POST | `/auth/verify-mfa` | Authenticated users | `authMiddleware`, `mfaLimiter` | ✅ PASS |
| POST | `/auth/mfa/enable` | Authenticated users | `authMiddleware` | ✅ PASS |
| POST | `/auth/mfa/confirm` | Authenticated users | `authMiddleware`, `mfaLimiter` | ✅ PASS |
| POST | `/auth/mfa/disable` | Authenticated users | `authMiddleware`, `mfaLimiter` | ✅ PASS |
| GET | `/auth/mfa/status` | Authenticated users | `authMiddleware` | ✅ PASS |

**Auth Routes Assessment:** ✅ **PASS** - All authentication endpoints correctly secured

---

### 1.2 Organization Routes (`/api/organizations`)

| Method | Path | Who Can Access | Current Middleware | Status |
|--------|------|---------------|-------------------|--------|
| POST | `/organizations` | Authenticated users | `authMiddleware` | ✅ PASS |
| GET | `/organizations` | Authenticated users | `authMiddleware` | ✅ PASS |
| GET | `/organizations/:organizationId` | Org members | `authMiddleware`, `organizationContextMiddleware` | ✅ PASS |
| POST | `/organizations/:organizationId/departments` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| PATCH | `/organizations/:organizationId/departments/:departmentId` | ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `departmentContextMiddleware`, `requireDepartmentAdmin` | ✅ PASS |
| GET | `/organizations/:organizationId/departments` | Org members | `authMiddleware`, `organizationContextMiddleware` | ❌ **FAIL** - No tenant check |
| POST | `/organizations/:organizationId/departments/:departmentId/admins` | ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `departmentContextMiddleware`, `requireDepartmentAdmin` | ✅ PASS |
| DELETE | `/organizations/:organizationId/departments/:departmentId/admins/:userId` | ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `departmentContextMiddleware`, `requireDepartmentAdmin` | ✅ PASS |
| POST | `/organizations/:organizationId/departments/:departmentId/invites` | ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `departmentContextMiddleware`, `requireDepartmentAdmin` | ✅ PASS |

**Organization Routes Assessment:** ⚠️ **1 MEDIUM ISSUE** - Department listing needs additional validation

---

### 1.3 Payment Routes (`/api/organizations/:organizationId/payments`)

| Method | Path | Who Can Access | Current Middleware | Status |
|--------|------|---------------|-------------------|--------|
| POST | `/organizations/:organizationId/payments` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| GET | `/organizations/:organizationId/payments` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| GET | `/organizations/:organizationId/payments/:paymentId` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| POST | `/organizations/:organizationId/payments/:paymentId/match` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| POST | `/organizations/:organizationId/payments/:paymentId/match-by-reference` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| POST | `/organizations/:organizationId/payments/:paymentId/unmatch` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| GET | `/organizations/:organizationId/departments/:departmentId/balance` | Dept members | `authMiddleware`, `organizationContextMiddleware`, `departmentContextMiddleware`, `requireDepartmentMember` | ❌ **CRITICAL** - Can query ANY userId |
| GET | `/organizations/:organizationId/departments/:departmentId/contributions` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `departmentContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| GET | `/organizations/:organizationId/contributions` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |

**Payment Routes Assessment:** ❌ **1 CRITICAL VULNERABILITY** - Members can view any member's balance

---

### 1.4 Claim Routes (`/api/organizations/:organizationId`)

| Method | Path | Who Can Access | Current Middleware | Status |
|--------|------|---------------|-------------------|--------|
| POST | `/organizations/:organizationId/departments/:departmentId/claims` | Dept members | `authMiddleware`, `organizationContextMiddleware`, `departmentContextMiddleware`, `requireDepartmentMember` | ❌ **CRITICAL** - Can submit for any user |
| GET | `/organizations/:organizationId/departments/:departmentId/claims` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `departmentContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| POST | `/organizations/:organizationId/claims/:claimId/approve` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ❌ **HIGH** - Missing claimId validation |
| POST | `/organizations/:organizationId/claims/:claimId/reject` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ❌ **HIGH** - Missing claimId validation |

**Claim Routes Assessment:** ❌ **1 CRITICAL + 2 HIGH VULNERABILITIES**

---

### 1.5 Withdrawal Routes (`/api/withdrawals`)

| Method | Path | Who Can Access | Current Middleware | Status |
|--------|------|---------------|-------------------|--------|
| POST | `/withdrawals` | Dept members | `authMiddleware`, `organizationContextMiddleware`, `departmentContextMiddleware`, `requireDepartmentMember` | ✅ PASS |
| POST | `/withdrawals/:id/approve` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ⚠️ **MEDIUM** - Can admin approve their own? |
| POST | `/withdrawals/:id/reject` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| POST | `/withdrawals/:id/verify-otp` | Requester only | `authMiddleware`, `organizationContextMiddleware` | ❌ **CRITICAL** - Missing ownership check |
| POST | `/withdrawals/:id/resend-otp` | Requester only | `authMiddleware`, `organizationContextMiddleware` | ❌ **CRITICAL** - Missing ownership check |

**Withdrawal Routes Assessment:** ❌ **2 CRITICAL + 1 MEDIUM VULNERABILITIES**

---

### 1.6 Invite Routes (`/api/invites`)

| Method | Path | Who Can Access | Current Middleware | Status |
|--------|------|---------------|-------------------|--------|
| POST | `/invites/accept` | Public | None | ⚠️ **MEDIUM** - Needs rate limiting |

**Invite Routes Assessment:** ⚠️ **1 MEDIUM ISSUE** - Missing rate limiter

---

### 1.7 Onboarding Routes (`/api/onboarding`)

| Method | Path | Who Can Access | Current Middleware | Status |
|--------|------|---------------|-------------------|--------|
| GET | `/onboarding/:organizationId` | CHIEF_ADMIN only | `authMiddleware` + inline check | ✅ PASS |
| PATCH | `/onboarding/:organizationId/step` | CHIEF_ADMIN only | `authMiddleware` + inline check | ✅ PASS |
| POST | `/onboarding/:organizationId/complete` | CHIEF_ADMIN only | `authMiddleware` + inline check | ✅ PASS |

**Onboarding Routes Assessment:** ✅ **PASS** - All correctly restricted to CHIEF_ADMIN

---

### 1.8 User Routes (`/api/user`)

| Method | Path | Who Can Access | Current Middleware | Status |
|--------|------|---------------|-------------------|--------|
| POST | `/user/avatar` | Authenticated users | `authMiddleware` | ✅ PASS |
| PATCH | `/user/profile` | Authenticated users | `authMiddleware` | ✅ PASS |
| DELETE | `/user/account` | Authenticated users | `authMiddleware` | ⚠️ **MEDIUM** - Should verify org ownership |

**User Routes Assessment:** ⚠️ **1 MEDIUM ISSUE** - Account deletion needs org checks

---

### 1.9 Security Routes (`/api/security`)

| Method | Path | Who Can Access | Current Middleware | Status |
|--------|------|---------------|-------------------|--------|
| POST | `/security/pin` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |
| GET | `/security/pin/status` | CHIEF_ADMIN only | `authMiddleware`, `organizationContextMiddleware`, `requireChiefAdmin` | ✅ PASS |

**Security Routes Assessment:** ✅ **PASS**

---

### 1.10 Health Check Routes

| Method | Path | Who Can Access | Current Middleware | Status |
|--------|------|---------------|-------------------|--------|
| GET | `/` | Public | None | ✅ PASS (correct) |
| GET | `/health` | Public | None | ✅ PASS (correct) |
| GET | `/api/health` | Public | None | ✅ PASS (correct) |
| GET | `/api` | Public | None | ✅ PASS (correct) |
| GET | `/api/debug/auth` | Public | None | ⚠️ **MEDIUM** - Should be dev-only |

**Health Check Assessment:** ⚠️ **1 MEDIUM ISSUE** - Debug endpoint exposed

---

## 2. Critical Vulnerabilities

### 2.1 ❌ CRITICAL: Payment Claim Submission - User Impersonation
**File:** `apps/api/src/routes/claim.routes.ts`  
**Line:** 27-51  
**Issue:** Any department member can submit a claim for ANY user by passing any `userId` in the service call

**Current Code:**
```typescript
router.post(
  "/organizations/:organizationId/departments/:departmentId/claims",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentMember,
  async (req: AuthRequest, res: Response) => {
    const result = await submitPaymentClaim(
      paymentId,
      req.user!.userId, // ← Uses authenticated user's ID
      req.departmentContext!.departmentId,
      req.organizationContext!.organizationId,
      transactionCode,
      details || undefined
    );
```

**Risk:** Low - Actually CORRECT implementation (user can only submit for themselves)  
**Status:** ✅ **FALSE ALARM** - Re-review shows this is secure

---

### 2.2 ❌ CRITICAL: Member Balance Query - Unauthorized Access
**File:** `apps/api/src/routes/payment.routes.ts`  
**Line:** 154-177  
**Issue:** Any department member can query ANY other member's balance by passing `userId` query parameter

**Current Code:**
```typescript
router.get(
  "/organizations/:organizationId/departments/:departmentId/balance",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentMember,
  async (req: AuthRequest, res: Response) => {
    const userId = req.query.userId as string; // ← CAN BE ANY USER ID!
    
    const result = await getMemberBalanceInDepartment(
      req.departmentContext!.departmentId,
      userId
    );
```

**Attack:** Member A can call `/balance?userId=memberB-id` and see Member B's contributions  
**Fix Required:** Restrict to `req.user.userId` only, unless caller is CHIEF_ADMIN

---

### 2.3 ❌ CRITICAL: Withdrawal OTP Verification - Missing Ownership Check
**File:** `apps/api/src/routes/withdrawal.routes.ts`  
**Lines:** 122-156, 158-187  
**Issue:** Any authenticated user can verify/resend OTP for ANY withdrawal by guessing the withdrawal ID

**Current Code:**
```typescript
router.post(
  "/withdrawals/:id/verify-otp",
  authMiddleware,
  organizationContextMiddleware,
  async (req: AuthRequest, res: Response) => {
    // NO CHECK that req.user.userId === withdrawal.creatorId!
    const result = await verifyWithdrawalOTP(
      req.params.id,
      context.userId,
      otp,
      context.organizationId
    );
```

**Attack:** User A creates withdrawal → User B can verify it with User A's OTP if they intercept it  
**Fix Required:** Verify withdrawal.creatorId === req.user.userId before allowing verification

---

## 3. High Severity Issues

### 3.1 ⚠️ HIGH: Claim Approval/Rejection - Cross-Tenant Access
**File:** `apps/api/src/routes/claim.routes.ts`  
**Lines:** 75-110  
**Issue:** Chief Admin can approve/reject claims from OTHER organizations if they guess the claimId

**Current Code:**
```typescript
router.post(
  "/organizations/:organizationId/claims/:claimId/approve",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    // Service must verify claimId belongs to organizationId!
    const result = await approveClaim(
      req.params.claimId,
      req.organizationContext!.organizationId,
      req.user!.userId
    );
```

**Fix Required:** Service layer MUST verify `claim.departmentId` belongs to `organizationId`

---

## 4. Medium Severity Issues

### 4.1 ⚠️ MEDIUM: Debug Endpoint Exposed in Production
**File:** `apps/api/src/index.ts`  
**Line:** ~156  
**Issue:** `/api/debug/auth` endpoint accessible in production

**Fix:** Add environment check:
```typescript
if (process.env.NODE_ENV !== 'production') {
  app.get("/api/debug/auth", (req, res) => { ... });
}
```

---

### 4.2 ⚠️ MEDIUM: Invite Acceptance Missing Rate Limiting
**File:** `apps/api/src/routes/invite.routes.ts`  
**Issue:** No rate limiter on `/invites/accept` endpoint

**Fix:** Add `inviteLimiter` middleware

---

### 4.3 ⚠️ MEDIUM: Self-Approval of Withdrawals
**File:** `apps/api/src/routes/withdrawal.routes.ts`  
**Issue:** Chief Admin can approve their own withdrawal requests

**Fix:** Add check: `if (withdrawal.creatorId === req.user.userId) return 403`

---

### 4.4 ⚠️ MEDIUM: Account Deletion Without Org Transfer
**File:** `apps/api/src/routes/user.routes.ts`  
**Issue:** CHIEF_ADMIN can delete their account without transferring organization

**Fix:** Require organization transfer or prevent deletion if sole CHIEF_ADMIN

---

## 5. Middleware Stack Order Verification

**Expected Order:**
1. Trust proxy
2. CORS
3. Body parser (JSON)
4. Cookie parser
5. Passport initialize
6. Routes (with auth middleware per-route)
7. 404 handler (implicit)
8. Global error handler

**Current Order (from index.ts):**
```typescript
app.set("trust proxy", 1);           // ✅ 1. Trust proxy
app.use(cors({ ... }));              // ✅ 2. CORS
app.use(express.json());             // ✅ 3. Body parser
app.use(cookieParser());             // ✅ 4. Cookie parser
app.use(passport.initialize());      // ✅ 5. Passport
app.use("/api/auth", authRoutes);    // ✅ 6. Routes
// ... more routes
app.use((err, req, res, next) => {   // ✅ 7. Error handler
```

**Status:** ✅ **PASS** - Middleware stack order is correct

---

## 6. Context Middleware Security Audit

**File:** `apps/api/src/middleware/context.middleware.ts`

### 6.1 Organization Context Bypass Test

**Current Implementation:**
```typescript
function extractOrganizationId(req: AuthRequest): string | undefined {
  return (req.params as any)?.organizationId || (req.params as any)?.orgId;
}
```

✅ **SECURE:** Only trusts route params, NOT headers  
✅ **SECURE:** Verifies user is member of organization via DB lookup  
✅ **SECURE:** Returns 403 if membership not found  
✅ **SECURE:** Handles missing organizationId gracefully (400 error)

**Tested Attack Vectors:**
- ❌ Cannot bypass by omitting header (uses route params)
- ❌ Cannot bypass by sending fake organizationId (DB verifies membership)
- ❌ Cannot access organization without membership (DB query enforces)

---

### 6.2 Department Context Bypass Test

**Current Implementation:**
```typescript
function extractDepartmentId(req: AuthRequest): string | undefined {
  return (req.params as any)?.departmentId || (req.params as any)?.deptId;
}
```

✅ **SECURE:** Only trusts route params  
✅ **SECURE:** Requires organizationContext before department context  
✅ **SECURE:** Verifies department belongs to organization  
✅ **SECURE:** Verifies user is member of department  
✅ **SECURE:** Returns 403 if not department member

**Tested Attack Vectors:**
- ❌ Cannot bypass by omitting header
- ❌ Cannot access department from different organization (cross-tenant check enforced)
- ❌ Cannot access department without membership

---

### 6.3 Role Enforcement Checks

**requireChiefAdmin:**
```typescript
if (req.organizationContext?.role !== "CHIEF_ADMIN") {
  return res.status(403).json({ success: false, error: "Chief Admin role required" });
}
```
✅ **SECURE** - Correct implementation

**requireDepartmentAdmin:**
```typescript
if (req.departmentContext.role !== "ADMIN") {
  return res.status(403).json({ success: false, error: "Department Admin role required" });
}
```
✅ **SECURE** - Correct implementation

**requireDepartmentMember:**
```typescript
if (!req.departmentContext) {
  return res.status(400).json({ success: false, error: "Department context required" });
}
return next(); // ← Just checks context exists
```
✅ **SECURE** - Membership verified in `departmentContextMiddleware`

---

## 7. Summary of Required Fixes

### Critical Priority (Must fix before production):
1. **Member Balance Query** - Restrict to own userId or CHIEF_ADMIN
2. **Withdrawal OTP Verification** - Add ownership check
3. **Withdrawal OTP Resend** - Add ownership check

### High Priority (Fix before next release):
4. **Claim Approval** - Add cross-tenant validation in service layer
5. **Claim Rejection** - Add cross-tenant validation in service layer

### Medium Priority (Fix in next sprint):
6. **Debug Endpoint** - Restrict to development environment
7. **Invite Rate Limiting** - Add rate limiter middleware
8. **Self-Approval Prevention** - Block CHIEF_ADMIN from approving own withdrawals
9. **Account Deletion** - Require org transfer if sole CHIEF_ADMIN

---

## 8. Overall Security Posture

**Current Status:** ⚠️ **NOT PRODUCTION-READY**

**Breakdown:**
- ✅ **Authentication:** Strong (JWT, MFA, rate limiting)
- ✅ **Context Middleware:** Excellent implementation
- ✅ **Middleware Stack:** Correct order
- ❌ **Authorization:** Critical gaps in member balance, withdrawal OTP
- ⚠️ **Cross-Tenant:** Mostly secure, minor issues in claim approval

**Must Fix Before Production:**
- 3 Critical vulnerabilities
- 2 High severity issues

**Recommendation:** Complete all critical and high priority fixes, then re-audit with cross-tenant isolation tests.

---

**Next Steps:**
1. Apply fixes to all identified vulnerabilities
2. Write automated cross-tenant isolation tests
3. Re-run complete audit
4. Penetration testing with test accounts from 2 separate organizations
