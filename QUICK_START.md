# 🚀 Contribly - Quick Start Guide

Get the Contribly platform up and running in 5 minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Git

## 1️⃣ Setup Backend

```bash
# Navigate to backend
cd apps/api

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your database URL and settings
# IMPORTANT: Set DATABASE_URL to your PostgreSQL connection string
# Example: postgresql://user:password@localhost:5432/contribly

# Run database migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

**Backend should now be running on http://localhost:3001/api**

## 2️⃣ Setup Frontend

```bash
# Open new terminal, navigate to frontend
cd apps/web

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Frontend should already point to correct API URL:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Start development server
npm run dev
```

**Frontend should now be running on http://localhost:3000**

## 3️⃣ Create Your First Organization

1. Go to http://localhost:3000
2. Click "Sign up" → Create account
3. You're now a **Chief Admin**! 🎉

## 4️⃣ Create a Department

1. On dashboard, create a department
2. Set monthly contribution amount (e.g., $100)
3. Department admins can manage members

## 5️⃣ Invite Members

1. Click "Generate Invite" on department
2. Share link with team member
3. Member signs up and accepts invite
4. Automatically assigned to department

## 6️⃣ Record Payments

1. Navigate to Payments → Record Payment
2. Enter amount, reference code (optional)
3. System matches by reference or manual match
4. Unmatched payments become claims

## 7️⃣ Approve Claims

1. Members submit claims for unmatched payments
2. Department admins see pending claims
3. Click "Approve" to accept claim
4. Balance auto-updates

## 8️⃣ Request Withdrawal

1. Member clicks "Request Withdrawal"
2. OTP sent to email (see backend logs in dev)
3. Enter OTP and account info
4. Chief admin approves
5. Funds ready for transfer

---

## 🎯 Test Account Credentials

After setup, create a test account:
- **Email**: test@example.com
- **Password**: TestPassword123!

---

## 📊 Dashboard Overview

### Chief Admin Dashboard
- Organization-wide metrics
- All departments and members
- Payment management
- Claims approval

### Department Admin Dashboard
- Department metrics
- Member list and balances
- Claim approval
- Quick actions

### Member Dashboard
- Personal balance
- Months cleared
- Pending carry-forward
- Request withdrawal

---

## 🔧 Common Tasks

### View Database
```bash
cd apps/api
npx prisma studio
```
Opens visual database editor at http://localhost:5555

### Reset Database
```bash
npx prisma migrate reset
```

### View API Logs
Check terminal where `npm run dev` is running in the `api` directory

### View Frontend Logs
Check browser DevTools Console (F12)

### Stop Services
- Backend: Press `Ctrl+C` in api terminal
- Frontend: Press `Ctrl+C` in web terminal

---

## ✨ Key Features Walkthrough

### 1. Multi-Organization Support
- Chief Admin can manage multiple organizations
- Sidebar org switcher
- Complete data isolation

### 2. Flexible Payment Matching
- Auto-match by reference code
- Manual matching in UI
- Fallback to claims system

### 3. Smart Carry-Forward
- Auto-calculate monthly clearance
- Example: $500 org amount
  - User contributes $600 → 1 month cleared + $100 carry-forward
  - User contributes $400 → 0 months cleared + $400 carry-forward

### 4. Secure Withdrawals
- OTP verification via email
- Chief Admin approval required
- PIN confirmation for security
- Full audit trail

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Can't connect to database
```
- Check DATABASE_URL in .env.local
- Ensure PostgreSQL is running
- Test connection: `psql "your-connection-string"`

### API Not Responding
```
Failed to fetch from API
```
- Verify backend is running (`npm run dev`)
- Check port 3001 is open
- Verify NEXT_PUBLIC_API_URL is correct

### Login Not Working
```
Invalid credentials
```
- Clear browser cookies: DevTools → Application → Cookies → Delete all
- Try logging in again
- Check email/password are correct

### Can't Send Invites
```
Email service error
```
- In development, check backend logs
- OTP/invite emails print to console
- Configure SMTP in .env for production

---

## 📱 Testing Payment Flow

1. **Record Payment**
   - Amount: $100
   - Reference: `DEPT-001` (matches department code)
   - Auto-matches to first member

2. **Unmatched Payment**
   - Amount: $50
   - Reference: `UNKNOWN`
   - Member must submit claim

3. **Approve Claim**
   - Department admin reviews
   - Click "Approve" to recalculate balance
   - Member can now withdraw

---

## 🔐 Security Notes

### Development Only
- JWT_SECRET in .env.example is just an example
- Generate strong secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- OTP emails print to console (real SMTP not configured)

### Production
- Use environment variables from CI/CD system
- Configure real SMTP for emails
- Enable HTTPS/SSL
- Use strong JWT_SECRET
- Enable rate limiting
- Set CORS_ORIGIN to your domain

---

## 📖 Additional Resources

### Backend Documentation
See `apps/api/README.md` for:
- Complete API reference
- Service documentation
- Middleware details

### Frontend Documentation
See `apps/web/README.md` for:
- Component API
- State management
- Styling guide

### Full Implementation Summary
See `IMPLEMENTATION_SUMMARY.md` for:
- Architecture overview
- All features list
- File structure
- Deployment guide

---

## 🎓 Learning Path

1. **Understand Multi-Tenancy**
   - Check `apps/api/src/middleware/context.middleware.ts`
   - See how org/dept headers validate access

2. **Learn Payment Flow**
   - Review `apps/api/src/services/matching.service.ts`
   - Check matching logic and fallback to claims

3. **Explore Carry-Forward Calculation**
   - See `apps/api/src/services/carryforward.service.ts`
   - Understand monthly clearance math

4. **Understand Withdrawal Security**
   - Review `apps/api/src/services/withdrawal.service.ts`
   - Check OTP and PIN integration

5. **Explore Frontend Integration**
   - See `apps/web/lib/api-client.ts`
   - Check how headers are auto-injected

---

## 🚢 Next Steps

### After Testing Locally
1. [ ] Set up Git repository
2. [ ] Configure GitHub Actions for CI/CD
3. [ ] Deploy backend to hosting provider
4. [ ] Deploy frontend to Vercel/Netlify
5. [ ] Configure production database
6. [ ] Set up monitoring and logging
7. [ ] Enable analytics
8. [ ] Configure real email service

### Feature Enhancements
1. [ ] Add dark mode
2. [ ] Implement data export (CSV/PDF)
3. [ ] Add real-time notifications
4. [ ] Implement member search
5. [ ] Add bulk payment import
6. [ ] Two-factor authentication

---

## 📞 Getting Help

- Check browser DevTools (F12) for frontend errors
- Check terminal logs for backend errors
- Review README files in each app directory
- Check IMPLEMENTATION_SUMMARY.md for architecture

---

**Happy coding! 🎉**

For detailed documentation, see the README files in `apps/api` and `apps/web` directories.
