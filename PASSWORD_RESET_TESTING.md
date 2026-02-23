# 🧪 Password Reset - Quick Testing Guide

## Prerequisites
- Backend running: `cd apps/api && npm run dev` (Port 3001)
- Frontend running: `cd apps/web && npm run dev` (Port 3000)
- Database connected and migrated

---

## 🚀 Quick Test (5 minutes)

### Step 1: Request Password Reset
1. Open browser to: `http://localhost:3000/forgot-password`
2. Enter a registered email address
3. Click "Send Reset Instructions"
4. You should see: "If an account exists with this email, password reset instructions have been sent."

### Step 2: Get Reset Link
**If SMTP is configured:**
- Check your email inbox for password reset email

**If SMTP not configured (development):**
- Check terminal where API is running
- Look for log line: `[PASSWORD RESET EMAIL] To: user@example.com, Link: http://localhost:3000/reset-password?token=...`
- Copy the full URL

### Step 3: Reset Password
1. Paste the reset link in browser (or click from email)
2. You'll see the "Create New Password" page
3. Enter new password:
   - Watch the **strength indicator** update in real-time
   - See requirements checklist with checkmarks
4. Confirm the same password in second field
   - Watch for "Passwords match" ✓ or "Passwords do not match" ✗
5. Click "Reset Password"
6. Should see success screen: "Password Reset!"
7. Auto-redirects to login page after 3 seconds

### Step 4: Login with New Password
1. Go to `/login`
2. Enter your email
3. Enter the new password you just created
4. Should successfully log in ✅

---

## ✅ What to Verify

### Backend Functionality
- [ ] Forgot password endpoint returns success (doesn't reveal if email exists)
- [ ] Reset token is generated and stored hashed in database
- [ ] Reset token expires after 1 hour
- [ ] Password validation rejects weak passwords
- [ ] Token can only be used once (cleared after successful reset)
- [ ] Audit logs created for both request and completion

### Frontend Functionality
- [ ] Forgot password page shows success state
- [ ] Reset password page reads token from URL
- [ ] Password strength indicator shows real-time feedback
- [ ] Requirements checklist updates as you type
- [ ] Passwords match validation works
- [ ] Success page shows and auto-redirects
- [ ] Error messages are clear and helpful

### Email Functionality
- [ ] Email is sent (if SMTP configured)
- [ ] Email contains correct reset link
- [ ] Email has Contribly branding
- [ ] Link expires warning is visible
- [ ] Security notice is present

---

## 🔍 Test Scenarios

### Test 1: Happy Path
✅ Request reset → Get email → Click link → Set new password → Login

### Test 2: Expired Token
1. Request password reset
2. Wait 61 minutes (or manually update `resetTokenExpiry` in database to past time)
3. Try to use reset link
4. Should see: "Reset token has expired. Please request a new password reset."

### Test 3: Weak Password
1. Request password reset
2. Click reset link
3. Try password "password123" (no uppercase)
4. Should see: "Password must contain at least one uppercase letter (A-Z)"

### Test 4: Passwords Don't Match
1. Request password reset
2. Click reset link
3. Enter "SecurePass123" in first field
4. Enter "SecurePass456" in second field
5. Should see red error: "Passwords do not match"

### Test 5: Invalid Token
1. Go directly to: `http://localhost:3000/reset-password?token=invalidtoken123`
2. Try to reset password
3. Should see: "Invalid or expired reset token"

### Test 6: Email Enumeration Prevention
1. Go to forgot password page
2. Enter non-existent email: `doesnotexist@example.com`
3. Should still see success message (doesn't reveal email doesn't exist)
4. No email sent (check terminal logs)

---

## 🐛 Common Issues & Solutions

### Issue: "Failed to send reset email"
**Solution:** SMTP not configured. Check terminal logs for reset link instead.

### Issue: Token is invalid immediately
**Solution:** Token hashing mismatch. Verify both forgot and reset functions use SHA-256.

### Issue: Password validation not working
**Solution:** Check backend logs for validation errors. Ensure password meets all requirements.

### Issue: Reset link doesn't work
**Solution:** Check FRONTEND_URL environment variable matches your actual frontend URL.

### Issue: Can't see email
**Solution:** 
- Development: Check terminal logs
- Production: Verify SMTP credentials are correct

---

## 📊 Database Inspection

### Check Reset Token in Database
```sql
-- See all users with active reset tokens
SELECT 
  email, 
  resetToken, 
  resetTokenExpiry 
FROM "User" 
WHERE resetToken IS NOT NULL;

-- Check if token is expired
SELECT 
  email,
  resetToken,
  resetTokenExpiry,
  CASE 
    WHEN resetTokenExpiry > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as status
FROM "User" 
WHERE email = 'test@example.com';
```

### Check Audit Logs
```sql
-- See password reset audit logs
SELECT 
  action,
  "createdAt",
  details
FROM "AuditLog"
WHERE action IN ('PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED')
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## ✨ Expected Console Logs

### Backend Terminal (when SMTP not configured)
```
[PASSWORD RESET EMAIL] To: user@example.com, Link: http://localhost:3000/reset-password?token=abc123...
```

### Backend Terminal (when password is reset)
```
✅ Password reset email sent to user@example.com
```

---

## 🎯 Success Criteria

All of these should work:
- ✅ User can request password reset
- ✅ Email is sent (or logged if SMTP not configured)
- ✅ Reset link is valid for 1 hour
- ✅ Password validation works on backend
- ✅ Password strength indicator works on frontend
- ✅ Passwords must match validation works
- ✅ Token can only be used once
- ✅ User can login with new password
- ✅ Audit logs are created
- ✅ Expired tokens are rejected with clear message
- ✅ Invalid tokens are rejected with clear message

---

## 🚀 Ready for Production

Once all tests pass:
1. Set up production SMTP credentials
2. Configure FRONTEND_URL to production domain
3. Test email delivery from production
4. Monitor audit logs for suspicious activity

---

**Happy Testing! 🎉**
