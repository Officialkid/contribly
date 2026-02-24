# 🚀 Quick Debugging Commands

## Immediate Actions

### 1. Enable Frontend Debug Logging
```javascript
// In browser console:
localStorage.setItem('debug_auth', 'true');
window.location.reload();

// Or add to URL:
https://contribly-web.onrender.com?debug=auth
```

### 2. Check What API Receives
```bash
# Visit in browser (logged in):
https://contribly-api.onrender.com/api/debug/auth
```

### 3. Run Full Auth Test Suite
```bash
cd scripts
node debug-auth.js your-email@example.com YourPassword123!
```

---

## Browser DevTools Checks

### Check Cookies
1. Open DevTools → **Application** tab
2. Left sidebar → **Cookies** → Select your domain
3. Look for `token` cookie

**✅ Good:**
- Token exists with long random string
- HttpOnly: ✓
- Secure: ✓ (in production)
- SameSite: None (production) or Lax (dev)

**❌ Bad:**
- No token cookie after login
- SameSite: Strict or Lax in production
- Secure: ✗ in production

### Check Network Request
1. DevTools → **Network** tab
2. Find `/api/auth/me` request
3. Click it → **Headers** section
4. Scroll to **Request Headers**

**✅ Good:**
```
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**❌ Bad:**
```
(no Cookie or Authorization header)
```

---

## Render Logs Quick Patterns

### Pattern 1: Success ✅
```
🔐 Auth middleware: { method: 'GET', path: '/api/auth/me', hasCookie: true }
✅ JWT verified: { userId: '...', email: '...' }
✅ Auth success: { userId: '...', email: '...' }
📍 /me endpoint reached - user authenticated
```

### Pattern 2: No Token ❌
```
🔐 Auth middleware: { hasCookie: false, hasAuthHeader: false }
❌ Auth failed: No token provided
   Cookies received: {}
```
**FIX:** Cookie not reaching API → Check CORS/cookie settings

### Pattern 3: Invalid Token ❌
```
🔐 Auth middleware: { hasCookie: true, ... }
❌ JWT verification failed: invalid signature
```
**FIX:** JWT_SECRET mismatch → Check environment variables

### Pattern 4: Expired Token ❌
```
🔐 Auth middleware: { hasCookie: true, ... }
❌ JWT verification failed: Token expired at 2026-02-20T...
```
**FIX:** User needs to re-login

---

## Common Fixes (Copy-Paste Ready)

### Fix 1: Cookie Settings (Most Likely Issue)

**File:** `apps/api/src/routes/auth.routes.ts`

Find the login route and update cookie settings:
```typescript
res.cookie("token", result.token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

**Key:** `sameSite: "none"` requires `secure: true` in production!

### Fix 2: Environment Variables

On **Render Dashboard** → **contribly-api** → **Environment**:

```bash
FRONTEND_URL=https://contribly-web.onrender.com
JWT_SECRET=your-secret-key-here-keep-it-long-and-random
NODE_ENV=production
```

**Important:** 
- `FRONTEND_URL` must match EXACTLY (no trailing slash)
- Don't change `JWT_SECRET` after users have logged in (they'll need to re-login)

### Fix 3: Fallback to Authorization Header

If cookies still don't work, use header-based auth.

**Frontend:** Store token in localStorage after login  
**Backend:** Already supports `Authorization: Bearer <token>` ✅

---

## Testing Checklist

Run through this in order:

- [ ] Enable debug logging (`localStorage.setItem('debug_auth', 'true')`)
- [ ] Log in to the app
- [ ] Check Application tab for `token` cookie
- [ ] Check Network tab for `Cookie` header in /me request
- [ ] Visit `/api/debug/auth` endpoint
- [ ] Check Render logs for auth middleware output
- [ ] Run `node debug-auth.js` script locally

**Stop when you find the issue!** Each step reveals where the problem is.

---

## Emergency Contact

**If stuck, provide:**
1. Browser DevTools screenshot (Network + Application tabs)
2. Render API logs (last 50 lines showing auth middleware)
3. Output of `/api/debug/auth` endpoint
4. Results of `node debug-auth.js`

---

## Most Likely Root Causes

**90% of 401 errors are caused by:**

1. **Cookie `sameSite` issue** (60%)
   - Production needs `sameSite: "none"` + `secure: true`
   - Check login route cookie settings

2. **CORS `origin` mismatch** (20%)
   - `FRONTEND_URL` doesn't match
   - Check Render environment variables

3. **Missing `JWT_SECRET`** (10%)
   - API can't verify tokens
   - Check Render environment variables

4. **Token expired** (10%)
   - Old development token
   - Clear cookies and re-login

---

## Status After Latest Changes

✅ **Added:**
- Frontend debug logging (enable with `?debug=auth`)
- Enhanced auth middleware logging (shows cookie vs header)
- JWT error logging (shows expiry, invalid signature, etc.)
- Debug endpoint (`/api/debug/auth`)
- Test script (`scripts/debug-auth.js`)
- Complete debugging guide

✅ **Already Working:**
- `credentials: 'include'` in frontend ✓
- Auth middleware applied to /me route ✓
- CORS credentials allowed ✓
- JWT verification implemented ✓

🔍 **Need to Check:**
- Cookie settings in production (sameSite + secure)
- Environment variables on Render
- What the browser actually sends
