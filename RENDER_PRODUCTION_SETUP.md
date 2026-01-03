# Render Production Setup Guide

## Complete Environment Variables for contribly-api

Copy and paste ALL of these environment variables in the Render dashboard:

```
CORS_ORIGIN=https://joincontribly.com,https://www.joincontribly.com,https://contribly-web.onrender.com
DATABASE_URL=<your_render_postgres_url>
FRONTEND_URL=https://contribly-web.onrender.com
GOOGLE_CALLBACK_URL=https://contribly-api.onrender.com/api/auth/google/callback
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
JWT_EXPIRES_IN=7d
JWT_SECRET=<generate_secure_32+_char_random_string>
NODE_ENV=production
NODE_VERSION=20
NPM_CONFIG_PRODUCTION=false
PORT=3001
SMTP_FROM="Contribly <noreply@joincontribly.com>"
SMTP_HOST=smtp.gmail.com
SMTP_PASSWORD=<your_gmail_app_password>
SMTP_PORT=587
SMTP_USER=<your_gmail_address>
```

**⚠️ CRITICAL - CORS_ORIGIN Must Include:**
- Your Render frontend URL: `https://contribly-web.onrender.com`
- Your custom domain: `https://joincontribly.com,https://www.joincontribly.com`
- **Note:** Comma-separated, no spaces between URLs

**⚠️ BEFORE PASTING:**
- Replace `<your_render_postgres_url>` with your Render PostgreSQL DATABASE_URL
- Replace `<your_google_client_id>` with your Google OAuth Client ID
- Replace `<your_google_client_secret>` with your Google OAuth Client Secret
- Replace `<your_gmail_app_password>` with your Gmail App Password
- Replace `<your_gmail_address>` with your Gmail email address
- For `JWT_SECRET`, generate using: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Your Actual Values (DO NOT COMMIT):

```
CORS_ORIGIN=https://joincontribly.com,https://www.joincontribly.com,https://contribly-web.onrender.com
DATABASE_URL=postgresql://contribly_db_user:wlqJjIu9KefIYi7L7BKTM3lmTN1UAmcF@dpg-d5bot5n5r7bs73aimqs0-a.oregon-postgres.render.com/contribly_db
FRONTEND_URL=https://contribly-web.onrender.com
GOOGLE_CALLBACK_URL=https://contribly-api.onrender.com/api/auth/google/callback
GOOGLE_CLIENT_ID=626367465372-0i4ilqof0d25fsctbg5g4ei2bakfrtba.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
JWT_EXPIRES_IN=7d
JWT_SECRET=6ba4fa862a3b41d5d7cd548cb24ac8b3f6d31f470770ca8145326cc71e7e5328
NODE_ENV=production
NODE_VERSION=20
NPM_CONFIG_PRODUCTION=false
PORT=3001
SMTP_FROM="Contribly <noreply@joincontribly.com>"
SMTP_HOST=smtp.gmail.com
SMTP_PASSWORD=lddt dbiv umaq pton
SMTP_PORT=587
SMTP_USER=danielmwalili1@gmail.com
```

## Step-by-Step Setup on Render

1. **Login to Render:** https://dashboard.render.com
2. **Select Service:** Click on `contribly-api` service
3. **Go to Environment:** Click "Environment" in the left sidebar
4. **Update CORS_ORIGIN:** Make sure it includes `https://contribly-web.onrender.com` in the comma-separated list
5. **Add/Update all variables above**
6. **Save Changes:** Click "Save Changes" button
7. **Wait for Deploy:** Service will redeploy automatically (2-5 minutes)
8. **Check Logs:** Look for "🌍 CORS allowed origins" to verify configuration

## Fix for Current 401 Error

The 401 error happens because `CORS_ORIGIN` was missing the Render frontend URL. After updating:

1. Go to Render dashboard → contribly-api → Environment
2. Find `CORS_ORIGIN` variable
3. Update value to: `https://joincontribly.com,https://www.joincontribly.com,https://contribly-web.onrender.com`
4. Save Changes
5. Wait for redeploy (check logs for CORS origins list)
6. Test at https://contribly-web.onrender.com

## Testing After Deployment

### Test Authentication:
1. Visit: https://contribly-web.onrender.com
2. Try to login or register
3. Should NOT see 401 errors in console
4. Cookies should persist across page refreshes

### Test Password Reset:
1. Visit: https://contribly-web.onrender.com/forgot-password
2. Enter email address
3. Check email for reset link
4. Complete password reset flow

### Verify CORS in Logs:
Look for this in Render logs:
```
🌍 CORS allowed origins: [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://contribly-web.onrender.com',
  'https://contribly-web.vercel.app',
  'https://contribly.onrender.com',
  'https://contribly-web.onrender.com',
  'https://joincontribly.com',
  'https://www.joincontribly.com'
]
```

## Production URLs

- **Frontend:** https://contribly-web.onrender.com
- **API:** https://contribly-api.onrender.com
- **Custom Domain:** https://joincontribly.com (when DNS configured)

## Common Issues

### 401 Unauthorized Errors
**Cause:** CORS_ORIGIN doesn't include the frontend URL sending requests
**Fix:** Add the frontend URL to CORS_ORIGIN (comma-separated, no spaces)

### Cookies Not Persisting
**Cause:** CORS credentials not properly configured or HTTPS required
**Fix:** Verify `credentials: true` in CORS config and using HTTPS URLs

### "Failed to load user: No authentication token"
**Cause:** Cookie not being sent with API requests (CORS issue)
**Fix:** Update CORS_ORIGIN to include exact frontend domain making requests

## Troubleshooting Checklist

- [ ] CORS_ORIGIN includes https://contribly-web.onrender.com
- [ ] FRONTEND_URL matches deployed frontend
- [ ] JWT_SECRET is set (not placeholder)
- [ ] Database migrations have run (check Render logs)
- [ ] SMTP credentials are correct
- [ ] Google OAuth credentials match Google Console
- [ ] Check Render logs for startup errors
