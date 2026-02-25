# Test Database Setup Guide

## Quick Setup for Onboarding Tests

### Step 1: Check PostgreSQL Installation
```powershell
psql --version
```

### Step 2: Create Test Database

**Option A: Using psql (if available in PATH)**
```powershell
psql -U postgres -c "CREATE DATABASE contribly_test;"
```

**Option B: Using pgAdmin**
1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" → "Database..."
4. Name: `contribly_test`
5. Click "Save"

**Option C: Using SQL Shell**
```sql
CREATE DATABASE contribly_test;
```

### Step 3: Update .env.test File

File already created at: `apps/api/.env.test`

Update the password if needed:
```env
TEST_DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/contribly_test
```

### Step 4: Run Migrations on Test Database

```powershell
cd packages/database

# For Windows PowerShell:
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/contribly_test"
npx prisma migrate deploy
```

OR

```bash
# For Git Bash / Linux / Mac:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/contribly_test" npx prisma migrate deploy
```

### Step 5: Verify Schema

```powershell
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/contribly_test"
npx prisma db push
```

### Step 6: Run Tests

```powershell
cd ../../apps/api
npm test -- onboarding.test.ts
```

---

## Common Issues

### Issue: "Authentication failed"
**Solution**: Check PostgreSQL password
1. Open PostgreSQL installation directory
2. Find `pgpass.conf` or check installation notes
3. Default password is often `postgres` but may have been changed during installation

### Issue: "Database does not exist"
**Solution**: Create database manually using pgAdmin or psql

### Issue: "Module not found: jest"
**Solution**: Install dependencies
```powershell
cd apps/api
npm install
```

### Issue: "Test timeout"
**Solution**: 
1. Ensure PostgreSQL is running
2. Check database connection in `.env.test`
3. Increase Jest timeout in `jest.config.js`

---

## Expected Results

After successful setup, running `npm test -- onboarding.test.ts` should show:

```
 PASS  src/__tests__/onboarding.test.ts
  Onboarding Integration Tests
    Suite A: Onboarding Auto-Creation
      ✓ should auto-create onboarding record when organization is created
    Suite B: Step Progression
      ✓ should update onboarding when step 1 is marked complete
      ✓ should progress through multiple steps correctly
    Suite C: Full Flow Completion
      ✓ should mark onboarding complete after all 4 steps
    Suite D: Skip to Complete
      ✓ should mark onboarding complete via complete endpoint
    Suite E: Persistence
      ✓ should persist onboarding state across requests
    Suite F: Access Control
      ✓ should return 403 for non-CHIEF_ADMIN member
      ✓ should return 401 for unauthenticated request
      ✓ should prevent non-CHIEF_ADMIN from updating steps
      ✓ should prevent non-CHIEF_ADMIN from completing onboarding
      ✓ should allow CHIEF_ADMIN to access all onboarding endpoints

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

---

## Alternative: Skip Test Database Setup (Not Recommended)

If you want to defer database setup, you can still verify test structure:

```powershell
# Check test file syntax
cd apps/api
npx tsc --noEmit
```

This validates TypeScript but won't run actual tests.
