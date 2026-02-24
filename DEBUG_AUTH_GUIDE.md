# Authentication System Debugging Guide

## 🚨 Current Issue: 401 Unauthorized on /api/auth/me

The frontend is getting a 401 error when calling `/api/auth/me` after login.

---

## 🔍 Step-by-Step Debugging Process

### **Step 1: Enable Frontend Debug Mode**

Add `?debug=auth` to your URL or run in browser console:
```javascript
localStorage.setItem('debug_auth', 'true');
window.location.reload();
```

This enables detailed logging of all API requests in the browser console.

### **Step 2: Check Browser Cookies**

After logging in, open DevTools:
1. Go to **Application** tab → **Cookies**
2. Look for `token` cookie
3. **Expected:** A long JWT string
4. **Attributes should be:**
   - `HttpOnly: true`
   - `Secure: true` (in production)
   - `SameSite: None` (in production) or `Lax` (in development)
   - `Domain:` Should match API domain

**If cookie is missing:** Login is not setting the cookie properly.

### **Step 3: Check Network Request to /api/auth/me**

In DevTools **Network** tab:
1. Find the `/api/auth/me` request
2. Click on it → **Headers** tab
3. Check **Request Headers:**
   - Should have: `Cookie: token=...`
   - Or: `Authorization: Bearer ...`
   
**If no Cookie or Authorization header:** Browser is not sending credentials.

### **Step 4: Check CORS Headers**

In the same Network request, check **Response Headers:**
- `Access-Control-Allow-Origin:` Should match your frontend URL
- `Access-Control-Allow-Credentials: true`

**If CORS headers missing:** API CORS misconfigured.

### **Step 5: Test API Debug Endpoint**

Open in browser (while logged in):
```
https://contribly-api.onrender.com/api/debug/auth
```

This shows:
- What cookies the API receives
- What headers the API sees
- Environment configuration

### **Step 6: Check Render Logs**

Go to Render dashboard → contribly-api service → Logs

Look for the auth middleware logs:
```
🔐 Auth middleware: { method: 'GET', path: '/api/auth/me', ... }
```

**Common patterns:**

**Pattern A: No token**
```
❌ Auth failed: No token provided
   Cookies received: {}
   Authorization header: none
```
→ **Problem:** Cookie not reaching API

**Pattern B: Invalid token**
```
❌ JWT verification failed: invalid signature
```
→ **Problem:** JWT_SECRET mismatch

**Pattern C: Expired token**
```
❌ JWT verification failed: Token expired at 2026-02-20T...
```
→ **Problem:** User needs to re-login

---

## 🐛 Common Issues & Fixes

### Issue 1: Cookie Not Being Sent Cross-Domain

**Symptoms:**
- Cookie exists in Application tab
- Cookie NOT in Network request headers
- Error: "No authentication token"

**Causes:**
- SameSite=Lax in production (should be None)
- Secure flag missing (required for SameSite=None)
- Domain mismatch

**Fix in API ([auth.routes.ts](c:/Users/DANIEL/Documents/WebApp Projects/contribly/apps/api/src/routes/auth.routes.ts)):**
```typescript
res.cookie("token", result.token, {
  httpOnly: true,
  secure: true,  // ← Must be true in production
  sameSite: "none",  // ← Must be "none" for cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000,
  // domain: ".onrender.com"  // ← Optional, might help
});
```

### Issue 2: CORS Not Allowing Credentials

**Symptoms:**
- Browser console shows CORS error
- Network tab shows request failed

**Fix in API ([index.ts](c:/Users/DANIEL/Documents/WebApp Projects/contribly/apps/api/src/index.ts)):**

Verify `FRONTEND_URL` environment variable matches EXACTLY:
```bash
# On Render dashboard:
FRONTEND_URL=https://contribly-web.onrender.com
```

### Issue 3: JWT_SECRET Mismatch

**Symptoms:**
- Login succeeds (gets token)
- Validation fails with "invalid signature"

**Fix:**
1. Go to Render → contribly-api → Environment
2. Check `JWT_SECRET` exists
3. **Do NOT change it** - users will need to re-login
4. If missing, set it and restart service

### Issue 4: Token Expired

**Symptoms:**
- Worked before, suddenly returns 401
- Logs show: "Token expired at..."

**Fix:**
- User needs to log out and log in again
- Tokens expire after 7 days

---

## 🧪 Manual Testing Commands

### Test 1: Check if API is accessible
```bash
curl https://contribly-api.onrender.com/api/health
```
Expected: `{"status":"ok", ...}`

### Test 2: Test login and capture cookie
```bash
curl -i -X POST https://contribly-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://contribly-web.onrender.com" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

Look for `Set-Cookie: token=...` in response headers.

### Test 3: Test /me with captured token
```bash
curl -X GET https://contribly-api.onrender.com/api/auth/me \
  -H "Origin: https://contribly-web.onrender.com" \
  -H "Cookie: token=PASTE_TOKEN_HERE" \
  -v
```

Should return user data, not 401.

---

## 📊 Debugging Checklist

Use this checklist to systematically diagnose the issue:

- [ ] **Frontend sends credentials**
  - [ ] `credentials: 'include'` in fetch calls ✅ (already set)
  - [ ] Debug logs show cookie/header being sent
  
- [ ] **Login sets cookie correctly**
  - [ ] Cookie appears in DevTools Application tab after login
  - [ ] Cookie has correct attributes (HttpOnly, Secure, SameSite)
  
- [ ] **Browser sends cookie to API**
  - [ ] Network tab shows `Cookie: token=...` header in /me request
  
- [ ] **CORS configured correctly**
  - [ ] `FRONTEND_URL` matches exact origin
  - [ ] `credentials: true` in CORS config ✅ (already set)
  - [ ] Response has `Access-Control-Allow-Credentials: true`
  
- [ ] **JWT verification works**
  - [ ] `JWT_SECRET` environment variable set on Render
  - [ ] API logs show successful token verification
  - [ ] Token not expired (< 7 days old)

- [ ] **Middleware applied to route**
  - [ ] `/me` route has `authMiddleware` ✅ (already set)
  - [ ] Logs show auth middleware running

---

## 🔧 Emergency Fixes

### Quick Fix 1: Fallback to Authorization Header

If cookies don't work, add header-based auth to frontend:

**In [api-client.ts](c:/Users/DANIEL/Documents/WebApp Projects/contribly/apps/web/lib/api-client.ts):**

```typescript
// Store token in localStorage after login
export const setToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

// Modify request function to send Authorization header
async function request<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const requestHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...options?.headers,
  };
  
  // ... rest of function
}
```

Then update login to store token:
```typescript
async login(email: string, password: string) {
  const result = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  
  if (result.token) {
    setToken(result.token);
  }
  
  return result;
}
```

### Quick Fix 2: Force Cookie Domain

In API login route, try setting explicit domain:

```typescript
res.cookie("token", result.token, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  domain: ".onrender.com",  // ← Add this
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

---

## 📝 What to Report

When asking for help, provide:

1. **Frontend console logs** (with `debug=auth` enabled)
2. **Network tab screenshot** of /api/auth/me request (Request Headers section)
3. **Application tab screenshot** showing cookies
4. **Render API logs** showing auth middleware output
5. **Output of** `/api/debug/auth` endpoint
6. **Environment variables set** on Render (without actual values)

---

## 🎯 Most Likely Causes (Ranked)

Based on the symptoms, here are the most likely causes:

1. **Cookie SameSite issue** (70% probability)
   - Production requires `SameSite=None; Secure`
   - Check login route cookie settings

2. **CORS origin mismatch** (20% probability)
   - `FRONTEND_URL` env var doesn't match actual URL
   - Check Render environment variables

3. **JWT_SECRET not set** (5% probability)
   - API can't verify tokens
   - Check Render environment variables

4. **Token expired** (3% probability)
   - Old token from development
   - Clear cookies and re-login

5. **Middleware not applied** (2% probability)
   - Route misconfigured
   - Already verified in code ✅

---

## 🚀 Next Steps

1. **Enable debug mode on frontend**
2. **Check browser DevTools** (Network + Application tabs)
3. **Check Render logs** for auth middleware output
4. **Visit `/api/debug/auth`** to see what API receives
5. **Follow debugging checklist** to narrow down the issue

Once you identify where the token is "lost" (browser→network→API), you'll know which fix to apply.
