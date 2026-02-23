# Quick Start: Setting Up Integration Tests

This guide will get you from zero to running tests in under 5 minutes.

## Step 1: Install Dependencies (30 seconds)

```bash
cd apps/api
npm install
```

This installs Jest, Supertest, and all testing dependencies.

## Step 2: Create Test Database (1 minute)

**Option A: Local PostgreSQL (Recommended)**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE contribly_test;

# Exit psql
\q
```

**Option B: Docker (If you don't have PostgreSQL installed)**

```bash
docker run --name contribly-test-db \
  -e POSTGRES_PASSWORD=testpass \
  -e POSTGRES_DB=contribly_test \
  -p 5433:5432 \
  -d postgres:15
```

## Step 3: Configure Test Environment (30 seconds)

```bash
# Copy example file
cp .env.test.example .env.test

# Edit .env.test
nano .env.test  # or use your preferred editor
```

Add your database URL:

**For Local PostgreSQL:**
```env
TEST_DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/contribly_test
```

**For Docker:**
```env
TEST_DATABASE_URL=postgresql://postgres:testpass@localhost:5433/contribly_test
```

## Step 4: Run Migrations (1 minute)

```bash
cd ../../packages/database

# Set environment variable
export TEST_DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/contribly_test"
# Windows PowerShell: $env:TEST_DATABASE_URL = "postgresql://postgres:yourpassword@localhost:5432/contribly_test"

# Run migrations
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
# Windows: $env:DATABASE_URL = $env:TEST_DATABASE_URL; npx prisma migrate deploy

cd ../../apps/api
```

## Step 5: Verify Setup (30 seconds)

```bash
npx tsx ../../scripts/verify-test-setup.ts
```

Expected output:
```
✅ PASS   | Environment Variable
✅ PASS   | Database Connection
✅ PASS   | Database Schema
✅ PASS   | Jest Installation
✅ PASS   | Test Files

🎉 Your test environment is ready! Run: npm test
```

## Step 6: Run Tests! (10 seconds)

```bash
npm test
```

You should see all 19 tests pass:

```
Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Time:        8.5s
```

---

## Troubleshooting

### "TEST_DATABASE_URL environment variable is required"

You forgot step 3. Create `.env.test` file.

### "Failed to connect"

Check your database is running:
```bash
psql $TEST_DATABASE_URL
```

### "relation does not exist"

You skipped step 4. Run migrations on your test database.

### Still stuck?

1. Run the verification script: `npx tsx scripts/verify-test-setup.ts`
2. Check the detailed guide: `apps/api/TESTING.md`
3. Ensure you're in the `apps/api` directory

---

## What's Next?

- **Run tests in watch mode:** `npm run test:watch`
- **Check coverage:** `npm run test:coverage`
- **Read detailed docs:** See `apps/api/TESTING.md`
- **Add to CI:** See the GitHub Actions example in `TESTING.md`

## Production Deployment Rule

**⚠️ All tests must pass before deploying to production!**

Add to your deployment checklist:
```bash
npm test  # Must show: Tests: 19 passed, 19 total
```

---

**Time to complete:** ~5 minutes  
**Tests covered:** 19 integration tests across 5 scenarios  
**Lines of production code protected:** 2000+
