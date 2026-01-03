# Database Migration Guide

## Current Status

✅ **Code Complete** - All authentication features implemented
✅ **TypeScript Compilation** - Passes with 0 errors
✅ **Frontend Build** - Successful
✅ **Database Migration** - Complete (Applied to Render PostgreSQL)
✅ **API Server** - Running at http://localhost:3001
✅ **Frontend Server** - Running at http://localhost:3000

## What Was Implemented

### Password Security Features
- **Password Validation**: 8+ characters, 1 number, 1 uppercase, 1 lowercase
- **Strength Indicator**: Real-time visual feedback (Weak/Medium/Strong)
- **Frontend Pages**: Register with strength meter, Forgot Password, Reset Password
- **Backend Validation**: Matching rules on server-side

### Forgot Password Flow
- Email-based password reset with secure tokens
- 1-hour token expiry
- HTML email templates with reset links
- Security warnings in emails

### Multi-Factor Authentication (MFA)
- 6-digit code generation
- Email delivery of MFA codes
- 10-minute code expiry
- API endpoints for request and verification

## Database Schema Changes

The following fields were added to the `User` model:

```prisma
model User {
  // ... existing fields ...
  
  // Password Reset
  resetToken        String?   @unique
  resetTokenExpiry  DateTime?
  
  // MFA
  mfaCode           String?
  mfaCodeExpiry     DateTime?
  mfaEnabled        Boolean   @default(false)
  
  @@index([resetToken])
}
```

## Migration Steps

### Option 1: Apply Migration (Recommended for Development)

```bash
cd packages/database
npx prisma migrate dev --name add_password_reset_and_mfa_fields
```

**This will:**
- Create a new migration file
- Add the 5 new columns to the User table
- Update the migration history

### Option 2: Fix Database Credentials First

If you get authentication errors, update the database credentials:

1. **Find your PostgreSQL password:**
   - Check PostgreSQL installation folder
   - Look for password set during installation
   - Default user is usually `postgres`

2. **Update `.env` files:**
   ```bash
   # packages/database/.env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/contribly
   
   # apps/api/.env.local
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/contribly
   ```

3. **Create database if it doesn't exist:**
   ```bash
   # Using psql
   psql -U postgres
   CREATE DATABASE contribly;
   \q
   ```

4. **Run migration:**
   ```bash
   cd packages/database
   npx prisma migrate dev --name add_password_reset_and_mfa_fields
   ```

### Option 3: Push Schema Without Migration (Quick Test)

If you want to test immediately without migration files:

```bash
cd packages/database
npx prisma db push
```

**Note:** This updates the database but doesn't create migration history files. Use for development only.

### Option 4: Production Migration (When Ready)

For production deployment on Render:

```bash
# On production, migrations run automatically during build
# Just push your code with the new schema
git add .
git commit -m "Add password reset and MFA features"
git push origin main
```

The build script should include:
```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && npm run compile"
  }
}
```

## Verify Migration Success

After running the migration, verify with:

```bash
cd packages/database
npx prisma studio
```

Check that the User model now has:
- resetToken
- resetTokenExpiry
- mfaCode
- mfaCodeExpiry
- mfaEnabled

## Environment Variables Needed

### For Email to Work:

```bash
# apps/api/.env.local (development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# For Gmail: Generate app-specific password at
# https://myaccount.google.com/apppasswords
```

### For Production (Render):

Set these environment variables on the API service:
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=your-email@gmail.com`
- `SMTP_PASSWORD=your-app-specific-password`
- `FRONTEND_URL=https://contribly-web.onrender.com`

## Testing the Features

### 1. Test Password Validation
```bash
cd apps/web
npm run dev
# Visit http://localhost:3000/register
# Try different passwords and watch strength indicator
```

### 2. Test Forgot Password
```bash
# Start API and Web
cd apps/api && npm run dev
cd apps/web && npm run dev

# Visit http://localhost:3000/forgot-password
# Enter email, check console for reset link
```

### 3. Test Password Reset
```bash
# Use reset link from email/console
# Should see password strength indicator
# Submit new password
```

### 4. Test MFA
```bash
# Make POST request to /api/auth/request-mfa (while logged in)
# Check email/console for 6-digit code
# POST to /api/auth/verify-mfa with code
```

## Current Error Explanation

The migration failed with:
```
Error: P1000: Authentication failed against database server at `localhost`,
the provided database credentials for `contribly` are not valid.
```

**Why:** The DATABASE_URL uses `contribly:contribly_dev_password` but this user may not exist in PostgreSQL, or the database `contribly` doesn't exist.

**Solution:** Follow Option 2 above to fix credentials, or use the default `postgres` user.

## Next Steps After Migration

1. ✅ Database migration applied
2. Test forgot password flow locally
3. Test password strength validation
4. Configure SMTP credentials for real email testing
5. Deploy to production
6. Test production authentication flows
7. Clean up test accounts (per user's request)

## Files Modified

### Frontend (7 files)
- `apps/web/lib/password-validation.ts` (new)
- `apps/web/components/auth/password-strength-indicator.tsx` (new)
- `apps/web/app/forgot-password/page.tsx` (new)
- `apps/web/app/reset-password/page.tsx` (new)
- `apps/web/lib/api-client.ts` (updated)
- `apps/web/app/register/page.tsx` (updated)
- `apps/web/app/login/page.tsx` (updated)

### Backend (4 files)
- `apps/api/src/utils/password-validation.ts` (new)
- `apps/api/src/services/email.service.ts` (updated - added nodemailer)
- `apps/api/src/services/auth.service.ts` (updated - added 4 functions)
- `apps/api/src/routes/auth.routes.ts` (updated - added 4 endpoints)

### Database (1 file)
- `packages/database/prisma/schema.prisma` (updated)

## API Endpoints Added

- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/request-mfa` - Request MFA code (authenticated)
- `POST /api/auth/verify-mfa` - Verify MFA code (authenticated)
