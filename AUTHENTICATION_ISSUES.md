# Authentication Issues - Production Fix Guide

## 🔴 Critical Issues Identified

### Issue 1: 401 Unauthorized on `/api/auth/me`
**Error:** `Failed to load resource: the server responded with a status of 401 ()`  
**Root Cause:** Authentication cookies are not being sent or read properly in production

### Issue 2: No Authentication Token
**Error:** `Failed to load user: Error: No authentication token`  
**Root Cause:** Frontend cannot access the authentication cookie

### Issue 3: 404 on Auth Callback
**Error:** `GET https://contribly-web.onrender.com/auth/callback?organizationId=... 404 (Not Found)`  
**Root Cause:** This is a **frontend** route but the error shows it's trying to access it as a resource (possibly CORS preflight or redirect issue)

## 🔍 Diagnosis Summary

### ✅ What's Working
- API is deployed on Render: `contribly-api.onrender.com`
- Frontend is deployed: `contribly-web.onrender.com`
- CORS is partially configured with allowed origins
- Cookie settings include `sameSite: "none"` and `secure: true` for production

### ❌ What's Broken

#### 1. **CORS Origin Mismatch**
The CORS configuration in `apps/api/src/index.ts` allows:
```typescript
const allowedOrigins = [
  "https://contribly-web.vercel.app",
  "https://contribly-web.onrender.com",    // ✅ This should work
  "https://contribly.onrender.com",
  process.env.FRONTEND_URL,
];
```

**Problem:** If `FRONTEND_URL` environment variable is not set correctly on Render, the backend won't recognize the frontend origin.

#### 2. **Cookie Domain Issues**
Cookies are being set but may not be accessible due to:
- Different domains: `contribly-api.onrender.com` (API) vs `contribly-web.onrender.com` (Frontend)
- Cross-origin cookies require specific domain/path settings
- `sameSite: "none"` requires `secure: true` (✅ already set)

#### 3. **Missing Environment Variable**
The `FRONTEND_URL` env var may not be set on Render API deployment.

## 🔧 Fix Steps

### Step 1: Set Environment Variables on Render (CRITICAL)

**On Render API Dashboard:**
1. Go to your API service on Render
2. Navigate to Environment tab
3. Add/verify these variables:
```
FRONTEND_URL=https://contribly-web.onrender.com
NODE_ENV=production
```

### Step 2: Update CORS Configuration

Update `apps/api/src/index.ts` to be more explicit:

```typescript
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://contribly-web.onrender.com",       // Primary production URL
  "https://contribly-web.vercel.app",
  "https://contribly.onrender.com",
  process.env.FRONTEND_URL,
].filter(Boolean);
```

### Step 3: Add Cookie Domain Configuration

Update cookie settings in `apps/api/src/routes/auth.routes.ts`:

```typescript
res.cookie("token", result.token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  // Don't set domain for cross-origin cookies - let browser handle it
});
```

### Step 4: Verify API Client Configuration

Check `apps/web/lib/api-client.ts` has correct API URL:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
```

**On Vercel/Render Frontend Dashboard:**
Add environment variable:
```
NEXT_PUBLIC_API_URL=https://contribly-api.onrender.com
```

### Step 5: Add Debugging

Add console logs to verify cookie setting in production:

```typescript
// In auth.routes.ts after setting cookie
console.log("🍪 Cookie set:", {
  token: !!userData.token,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  origin: req.headers.origin,
});
```

## 🚀 Implementation Plan

### Immediate Actions (Required for Auth to Work):

1. **Set `FRONTEND_URL` on Render API service** ⚡ CRITICAL
   - Value: `https://contribly-web.onrender.com`

2. **Set `NEXT_PUBLIC_API_URL` on Render Frontend service** ⚡ CRITICAL
   - Value: `https://contribly-api.onrender.com`

3. **Redeploy both services** after environment variables are set

### Code Changes (Recommended):

4. **Update CORS allowed origins list** to be more explicit
5. **Add better error logging** for cookie/auth failures
6. **Add health check endpoint** to verify CORS and cookies

## 🧪 Testing After Fixes

1. **Test CORS:**
   ```bash
   curl -H "Origin: https://contribly-web.onrender.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS \
        https://contribly-api.onrender.com/api/auth/me
   ```

2. **Test Cookie Setting:**
   - Login via Google OAuth
   - Check browser DevTools > Application > Cookies
   - Verify `token` cookie exists with:
     - ✅ Secure: true
     - ✅ HttpOnly: true
     - ✅ SameSite: None

3. **Test Auth Flow:**
   - Clear all cookies
   - Click "Sign in with Google"
   - Should redirect to `/auth/callback?organizationId=...`
   - Should then redirect to `/orgs/[orgId]`
   - Should load user data successfully

## 📋 Checklist

- [ ] Set `FRONTEND_URL` environment variable on Render API
- [ ] Set `NEXT_PUBLIC_API_URL` environment variable on Render Frontend
- [ ] Verify CORS origins include production frontend URL
- [ ] Redeploy API service
- [ ] Redeploy Frontend service
- [ ] Test Google OAuth login flow
- [ ] Verify cookies are set correctly
- [ ] Verify `/api/auth/me` returns 200
- [ ] Verify auth callback route works

## 🔗 Resources

- Render Environment Variables: https://render.com/docs/environment-variables
- Cross-Origin Cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite
- Next.js Environment Variables: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

## Next Steps After This Document

I will now:
1. ✅ Update CORS configuration to be more robust
2. ✅ Add better logging for debugging
3. ✅ Create a health check endpoint
4. ⏳ Wait for you to set environment variables on Render (you must do this)
5. ⏳ Redeploy after env vars are set
