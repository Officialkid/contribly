# 🚨 Production Deployment Fix Guide

## Issues Found

1. ✅ **Fixed**: Missing favicon (404 error)
2. ✅ **Fixed**: Frontend ready with proper configuration  
3. 🔴 **ACTION REQUIRED**: API redirecting to localhost instead of production URL
4. 🔴 **ACTION REQUIRED**: Set production environment variable on Render

---

## 🔴 URGENT: Fix API Redirect (DO THIS NOW)

### Step 1: Set Frontend URL on Render API Service

1. Go to https://dashboard.render.com
2. Click on your **`contribly-api`** service
3. Go to **Environment** tab (left sidebar)
4. Click **"Add Environment Variable"**
5. Add:
   - **Key**: `FRONTEND_URL`
   - **Value**: `https://contribly-web.onrender.com`
     *(Replace with your actual frontend URL if different)*
6. Click **"Save Changes"**

### Step 2: Redeploy API Service

1. Stay on the `contribly-api` service page
2. Click **"Manual Deploy"** button (top right)
3. Select **"Deploy latest commit"**
4. Wait for deployment (~2-3 minutes)
5. Check logs to verify no errors

### Step 3: Verify Fix

1. Open your frontend URL in browser
2. Try Google Sign In
3. Check that it redirects correctly (not to localhost)
4. Verify no connection errors in console

---

## ✅ Fixes Already Applied

### 1. Added Favicon
- Created `/public/favicon.svg` with Contribly logo
- Updated `app/layout.tsx` with favicon metadata
- No more 404 errors for favicon

### 2. Frontend Configuration
- All legacy headers removed from API client
- Proper error handling with toasts
- Onboarding flow for new users
- Mobile-friendly with keyboard navigation

---

## Expected Behavior After Fix

### Before (Current - BROKEN):
```
Google Sign In → API → Redirect to http://localhost:3000/auth/callback
                              ↑
                        ERR_CONNECTION_REFUSED
```

### After (Fixed):
```
Google Sign In → API → Redirect to https://contribly-web.onrender.com/auth/callback
                              ↑
                        ✅ SUCCESS
```

---

## Verification Checklist

After deploying the fix, verify:

✅ **No Console Errors:**
- [ ] No `favicon.ico` 404
- [ ] No CORS errors
- [ ] No `ERR_CONNECTION_REFUSED`
- [ ] No 401 errors on `/api/auth/me`

✅ **Google Sign In Works:**
- [ ] Click "Sign in with Google"
- [ ] Redirects to Google
- [ ] After auth, redirects to your frontend (not localhost)
- [ ] User is logged in successfully

✅ **Frontend Features Work:**
- [ ] Dashboard loads
- [ ] Organization selection works
- [ ] Department data displays
- [ ] No infinite loaders

---

## If Still Having Issues

### Check API Logs
```bash
# In Render dashboard, check contribly-api logs for:
✅ Redirecting to: https://contribly-web.onrender.com/auth/callback
```

Should show your production URL, NOT localhost.

### Check Frontend Environment
Verify in Render dashboard → contribly-web → Environment:
```
NEXT_PUBLIC_API_URL=https://contribly-api.onrender.com/api
```

### Check CORS Configuration
In your API logs, verify CORS allows:
- `https://contribly-web.onrender.com`
- `credentials: true`

---

## Deploy These Frontend Fixes

After setting up the environment variable on Render:

```powershell
cd "C:\Users\DANIEL\Documents\Website Projects\contribly"
git add .
git commit -m "fix: Add favicon and update frontend configuration"
git push origin main
```

Render will auto-deploy the frontend with the favicon fix.

---

## Summary

**What You Need to Do:**
1. ✅ Set `FRONTEND_URL` env var on Render API service
2. ✅ Redeploy API service
3. ✅ Commit and push frontend fixes
4. ✅ Verify Google Sign In works
5. ✅ Test full user flow

**Time Required:** 5-10 minutes

**Risk:** Low (only environment variable change)

---

## Need Help?

If you're still seeing issues after these steps:
1. Check Render API logs for errors
2. Check browser console for errors
3. Verify environment variables are saved
4. Try clearing browser cache/cookies
5. Test in incognito mode
