# Render Environment Variables Setup

## 🚨 CRITICAL: Set These Before Deployment

### API Service (contribly-api.onrender.com)

Go to your API service dashboard → Environment tab → Add these variables:

```bash
# Required for Production
NODE_ENV=production
FRONTEND_URL=https://contribly-web.onrender.com
PORT=3001

# Database (should already be set)
DATABASE_URL=<your-postgresql-connection-string>

# JWT Secret (should already be set)
JWT_SECRET=<your-secret-key>

# Google OAuth (should already be set)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://contribly-api.onrender.com/api/auth/google/callback
```

### Frontend Service (contribly-web.onrender.com)

Go to your Frontend service dashboard → Environment tab → Add these variables:

```bash
# Required for API Communication
NEXT_PUBLIC_API_URL=https://contribly-api.onrender.com

# Google OAuth Client ID (for frontend button)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
```

## ✅ Verification Steps

### 1. Check API Health Endpoint

After setting env vars and redeploying, test:

```bash
curl https://contribly-api.onrender.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Contribly API is running",
  "environment": "production",
  "cors": {
    "allowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://contribly-web.onrender.com",
      "https://contribly-web.vercel.app",
      "https://contribly.onrender.com",
      "https://contribly-web.onrender.com"
    ],
    "requestOrigin": "none"
  },
  "timestamp": "2026-01-03T..."
}
```

### 2. Check CORS from Frontend Origin

```bash
curl -H "Origin: https://contribly-web.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://contribly-api.onrender.com/api/health
```

Expected headers in response:
```
Access-Control-Allow-Origin: https://contribly-web.onrender.com
Access-Control-Allow-Credentials: true
```

### 3. Check Logs After OAuth Login

After attempting Google login, check Render logs for:

```
🍪 Cookie set on OAuth: {
  hasToken: true,
  secure: true,
  sameSite: 'none',
  httpOnly: true,
  origin: 'https://contribly-web.onrender.com',
  userEmail: 'user@example.com'
}
```

### 4. Check Browser Cookies

After successful OAuth:
1. Open DevTools > Application > Cookies
2. Look for `token` cookie under `contribly-api.onrender.com`
3. Verify:
   - ✅ Value exists (long JWT string)
   - ✅ HttpOnly: true
   - ✅ Secure: true
   - ✅ SameSite: None
   - ✅ Path: /
   - ✅ Expires: ~7 days from now

## 🐛 Troubleshooting

### Issue: "No authentication token" error

**Check:**
1. Cookie is being set (check Render API logs for "🍪 Cookie set")
2. Cookie is present in browser (DevTools > Application > Cookies)
3. Cookie domain matches API domain
4. CORS is allowing credentials

**Fix:**
- Verify `FRONTEND_URL` is set correctly
- Verify `credentials: true` in CORS config
- Check browser is not blocking third-party cookies

### Issue: "CORS policy: origin not allowed"

**Check API logs for:**
```
❌ CORS: Rejecting origin: https://...
   Allowed origins: [...]
```

**Fix:**
- Add the rejected origin to `allowedOrigins` in `apps/api/src/index.ts`
- Redeploy API service

### Issue: 401 on /api/auth/me

**Check API logs for:**
```
🔐 Auth middleware: {
  hasCookie: false,
  hasAuthHeader: false,
  hasToken: false,
  origin: 'https://contribly-web.onrender.com',
  path: '/api/auth/me'
}
```

**This means:**
- Cookie is not being sent from frontend
- Check if `credentials: 'include'` is set in `api-client.ts` (✅ already set)
- Check if CORS is allowing credentials (✅ already set)
- Check if cookie SameSite is set to "none" for cross-domain (✅ already set)

### Issue: Cookie not persisting across requests

**Possible causes:**
1. Cookie domain mismatch
2. SameSite policy blocking
3. Browser privacy settings blocking third-party cookies

**Fix:**
- Don't set `domain` property in cookie options (let browser handle it)
- Use `sameSite: "none"` with `secure: true` for production
- Ask users to allow cookies for your site

## 📝 Deployment Checklist

Before deploying:
- [ ] Set all environment variables on Render API service
- [ ] Set all environment variables on Render Frontend service
- [ ] Commit and push latest code changes
- [ ] Verify CORS allowed origins include production URL
- [ ] Verify cookie settings use `sameSite: "none"` and `secure: true` in production

After deploying:
- [ ] Test `/api/health` endpoint
- [ ] Test CORS with curl
- [ ] Attempt Google OAuth login
- [ ] Check Render logs for cookie/auth messages
- [ ] Verify cookie is set in browser
- [ ] Test navigating to dashboard (should load user)

## 🎯 Expected Log Output (Successful Auth)

```
🌍 CORS allowed origins: [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://contribly-web.onrender.com',
  ...
]

✅ CORS: Allowing origin: https://contribly-web.onrender.com

🔵 Google OAuth callback handler triggered
🔵 User data from passport: {
  hasUser: true,
  hasToken: true,
  userId: 'cm...',
  organizationId: 'cm...'
}
🔵 Setting cookie for user: cm...
🍪 Cookie set on OAuth: {
  hasToken: true,
  secure: true,
  sameSite: 'none',
  httpOnly: true,
  origin: 'https://contribly-web.onrender.com',
  userEmail: 'user@example.com'
}
✅ Redirecting to: https://contribly-web.onrender.com/auth/callback?organizationId=cm...

🔐 Auth middleware: {
  hasCookie: true,
  hasAuthHeader: false,
  hasToken: true,
  origin: 'https://contribly-web.onrender.com',
  path: '/api/auth/me'
}
✅ Auth success: { userId: 'cm...', email: 'user@example.com' }
```

## 🔗 Quick Links

- [Render Dashboard](https://dashboard.render.com)
- [API Service Logs](https://dashboard.render.com/web/your-api-service)
- [Frontend Service Logs](https://dashboard.render.com/static/your-frontend-service)
- [Google Cloud Console](https://console.cloud.google.com) (for OAuth credentials)
