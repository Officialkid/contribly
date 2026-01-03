# Render Production Setup Guide

## Complete Environment Variables for contribly-api

Copy and paste ALL of these environment variables in the Render dashboard:

```
CORS_ORIGIN=https://joincontribly.com,https://www.joincontribly.com
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

**⚠️ BEFORE PASTING:**
- Replace `<your_render_postgres_url>` with your Render PostgreSQL DATABASE_URL
- Replace `<your_google_client_id>` with your Google OAuth Client ID
- Replace `<your_google_client_secret>` with your Google OAuth Client Secret
- Replace `<your_gmail_app_password>` with your Gmail App Password (from Google Account settings)
- Replace `<your_gmail_address>` with your Gmail email address
- For `JWT_SECRET`, generate a secure random string using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Replace `<generate_secure_32+_char_random_string>` with the generated value

## Step-by-Step Setup on Render

1. **Login to Render:** https://dashboard.render.com
2. **Select Service:** Click on `contribly-api` service
3. **Go to Environment:** Click "Environment" in the left sidebar
4. **Clear existing variables** (optional but recommended for fresh start)
5. **Add each variable above:**
   - Click "Add Environment Variable"
   - Copy name and value exactly as shown
   - Remember to replace JWT_SECRET with generated value
6. **Save Changes:** Click "Save Changes" button
7. **Wait for Deploy:** Service will automatically redeploy (takes 2-5 minutes)
8. **Check Logs:** Monitor deployment logs for any errors

## Testing After Deployment

### Test Password Reset Flow:
1. Visit: https://contribly-web.onrender.com/forgot-password
2. Enter your email address
3. Check email inbox (and spam folder) for reset link
4. Click reset link and set new password
5. Login with new password

### Test API Health:
```bash
curl https://contribly-api.onrender.com/api/auth/me
```

### Test Registration with Password Strength:
1. Visit: https://contribly-web.onrender.com/register
2. Watch password strength indicator change as you type
3. Password must have: 8+ chars, 1 number, 1 uppercase, 1 lowercase

## Production URLs

- **Frontend:** https://contribly-web.onrender.com
- **API:** https://contribly-api.onrender.com
- **Custom Domain:** https://joincontribly.com (when DNS configured)

## Troubleshooting

### Emails Not Sending
- Verify SMTP_USER and SMTP_PASSWORD are correct
- Check Gmail account allows "Less secure app access" or use App Password
- Check Render logs for SMTP connection errors

### CORS Errors
- Verify CORS_ORIGIN includes your frontend domains
- Check FRONTEND_URL matches deployed frontend URL

### Database Connection Issues
- Render automatically sets DATABASE_URL when you link the PostgreSQL database
- If issues persist, check database is running in Render dashboard

### Authentication Not Working
- Verify JWT_SECRET is set (not the placeholder text)
- Check Google OAuth credentials are correct
- Verify GOOGLE_CALLBACK_URL matches Render API URL
