# Payment Lifecycle Integration Tests

## Overview

Comprehensive integration tests for the Contribly payment lifecycle, covering the complete flow from recording payments through matching, balance calculations, claims, and withdrawals.

**Flow Tested:**
```
Record Payment → Match to Member → Balance Recalculates → Member Sees Updated Balance
```

## Test Scenarios

### Scenario A: Happy Path Manual Payment Match
- Admin records a payment of KES 100 (10,000 units) for member 1
- System automatically matches payment to member 1 by payment reference
- Verifies member 1 balance shows `monthsCleared = 1`
- Verifies member 2 balance shows `monthsCleared = 0`

### Scenario B: Overpayment Carry Forward
- Admin records a payment of KES 250 (25,000 units) for member 1 (2.5x monthly contribution)
- Verifies system calculates `monthsCleared = 2` (or 3 cumulative)
- Verifies `carryForward = 5,000` (excess amount)

### Scenario C: Unmatched Payment and Claim Flow
- Admin records payment with unrecognized reference → status = `UNMATCHED`
- Member 2 submits a claim for the unmatched payment → claim status = `PENDING`
- Admin approves the claim
- Verifies payment status changes to `MATCHED`
- Verifies member 2 balance shows `monthsCleared = 1`

### Scenario D: Withdrawal Flow
- Records and matches 3 months of payments for member 1 (KES 300 / 30,000 units total)
- Admin requests withdrawal of KES 200 (20,000 units) → status = `PENDING_APPROVAL`
- Chief Admin approves with OTP and PIN → status = `COMPLETED`
- Verifies department balance reduced by 20,000

### Scenario E: Overdraft Prevention
- Attempts to create withdrawal larger than department balance
- Verifies API returns `400` error with appropriate message
- Verifies no withdrawal record was created

## Setup

### 1. Install Dependencies

```bash
cd apps/api
npm install
```

This installs:
- `jest` - Test framework
- `ts-jest` - TypeScript support for Jest
- `supertest` - HTTP assertions
- `@types/jest` and `@types/supertest` - TypeScript definitions

### 2. Create Test Database

**⚠️ CRITICAL: Use a separate test database, NEVER your development or production database!**

The tests will create and delete data. Using your regular database will result in data loss.

**Option A: Local PostgreSQL**

```bash
# Create test database
psql -U postgres
CREATE DATABASE contribly_test;
\q
```

**Option B: Docker PostgreSQL**

```bash
docker run --name contribly-test-db \
  -e POSTGRES_PASSWORD=testpassword \
  -e POSTGRES_DB=contribly_test \
  -p 5433:5432 \
  -d postgres:15
```

**Option C: Render Test Database**

Create a separate free PostgreSQL database on Render for testing.

### 3. Configure Test Environment

Copy the example environment file:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` and add your test database URL:

```env
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/contribly_test
```

**Example URLs:**

Local:
```
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/contribly_test
```

Docker (port 5433):
```
TEST_DATABASE_URL=postgresql://postgres:testpassword@localhost:5433/contribly_test
```

Render:
```
TEST_DATABASE_URL=postgresql://user:pass@dpg-xxx.oregon-postgres.render.com/contribly_test
```

### 4. Run Database Migrations

Apply the schema to your test database:

```bash
# Set the DATABASE_URL temporarily to your test database
export DATABASE_URL=$TEST_DATABASE_URL  # Linux/Mac
# OR
$env:DATABASE_URL = $env:TEST_DATABASE_URL  # PowerShell

# Run migrations
cd ../../packages/database
npx prisma migrate deploy

# Or use migrate dev if you need to create migrations
npx prisma migrate dev
```

## Running Tests

### Run All Tests

```bash
cd apps/api
npm test
```

### Watch Mode (re-run on file changes)

```bash
npm run test:watch
```

### With Coverage Report

```bash
npm run test:coverage
```

Expected output:
```
 PASS  src/__tests__/payment-lifecycle.test.ts
  Payment Lifecycle Integration Tests
    Scenario A: Happy Path Manual Payment Match
      ✓ should allow admin to record a payment for member 1 (150ms)
      ✓ should automatically match payment to member 1 by reference (50ms)
      ✓ should show member 1 with monthsCleared = 1 (80ms)
      ✓ should show member 2 with monthsCleared = 0 (75ms)
    Scenario B: Overpayment Carry Forward
      ✓ should record an overpayment for member 1 (120ms)
      ✓ should calculate monthsCleared = 3 and carryForward = 5000 (85ms)
    Scenario C: Unmatched Payment and Claim Flow
      ✓ should create an unmatched payment (130ms)
      ✓ should allow member 2 to submit a claim (95ms)
      ✓ should allow admin to approve the claim (110ms)
      ✓ should update payment status to MATCHED (60ms)
      ✓ should show member 2 with monthsCleared = 1 (70ms)
    Scenario D: Withdrawal Flow
      ✓ should record 3 additional payments for member 1 (400ms)
      ✓ should get current department balance (65ms)
      ✓ should allow admin to request a withdrawal (120ms)
      ✓ should allow chief admin to approve withdrawal (180ms)
      ✓ should reduce department balance by 20000 (70ms)
    Scenario E: Overdraft Prevention
      ✓ should get current withdrawal count (45ms)
      ✓ should reject withdrawal larger than balance (90ms)
      ✓ should not create a withdrawal record (40ms)

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Time:        8.532 s
```

## Test Structure

### Test Files

```
apps/api/src/__tests__/
├── setup.ts                     # Jest setup, environment validation
├── helpers.ts                   # Test utilities (seed, cleanup)
└── payment-lifecycle.test.ts    # Main integration tests
```

### Test Flow

1. **beforeAll**: Seeds test data (organization, users, department, members)
2. **Test Scenarios**: Run independently with clean state
3. **afterAll**: Cleans up all seeded data

### Test Data Structure

Each test run creates:
- 1 organization
- 1 chief admin user
- 1 department (monthlyContribution = 10,000 = KES 100)
- 2 member users with unique payment references

All data is cleaned up after tests complete.

## Troubleshooting

### Error: "TEST_DATABASE_URL environment variable is required"

**Solution:** Create `.env.test` file with `TEST_DATABASE_URL` set.

### Error: "Cannot find module"

**Solution:** Run `npm install` in `apps/api` directory.

### Error: "relation does not exist"

**Solution:** Run database migrations on your test database:
```bash
cd packages/database
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
```

### Tests Fail: "Failed to login chief admin"

**Causes:**
1. Database not migrated
2. Wrong database URL
3. Prisma client not generated

**Solution:**
```bash
cd packages/database
npx prisma generate
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
```

### Tests Hang or Timeout

**Cause:** Database connection issues or Jest not exiting

**Solution:**
1. Check database is accessible: `psql $TEST_DATABASE_URL`
2. Ensure tests call `disconnectPrisma()` in `afterAll`
3. Increase timeout in `jest.config.js`: `testTimeout: 60000`

### Error: "ECONNREFUSED" or "Connection refused"

**Cause:** Database server not running

**Solution:**
- **Local PostgreSQL:** `sudo service postgresql start`
- **Docker:** `docker start contribly-test-db`
- **Render:** Check service status in dashboard

### Tests Pass Locally but Fail in CI

**Causes:**
1. CI environment doesn't have `TEST_DATABASE_URL`
2. Database migrations not applied in CI

**Solution:** Add to CI configuration:
```yaml
env:
  TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
steps:
  - name: Setup test database
    run: |
      cd packages/database
      npx prisma migrate deploy
  - name: Run tests
    run: cd apps/api && npm test
```

## Production Deployment Requirement

**⚠️ All tests must pass before any production deployment is approved.**

Add this to your deployment checklist:
1. Run tests locally: `npm test`
2. Verify all scenarios pass
3. Check coverage report: `npm run test:coverage`
4. Review test output for warnings
5. Only deploy if all tests pass

## Adding New Tests

To add new test scenarios:

1. **Create test file:**
   ```typescript
   // src/__tests__/my-feature.test.ts
   import { seedTestData, cleanupTestData } from './helpers.js';
   
   describe('My Feature', () => {
     let testData;
     
     beforeAll(async () => {
       testData = await seedTestData();
     });
     
     afterAll(async () => {
       await cleanupTestData(testData);
     });
     
     it('should do something', async () => {
       // Your test here
     });
   });
   ```

2. **Run your new tests:**
   ```bash
   npm test -- --testPathPattern=my-feature
   ```

3. **Add to CI pipeline** once working

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: contribly_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/contribly_test
        run: |
          cd packages/database
          npx prisma migrate deploy
      
      - name: Run tests
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/contribly_test
        run: |
          cd apps/api
          npm test
```

## Best Practices

### ✅ DO

- Use a separate test database
- Clean up test data in `afterAll`
- Make tests independent (no shared state)
- Test both success and error cases
- Use meaningful test descriptions
- Assert specific values, not just truthy/falsy

### ❌ DON'T

- Use development or production database
- Leave test data in the database
- Depend on test execution order
- Test implementation details
- Mock everything (integration tests need real DB)
- Skip cleanup in `afterAll`

## Support

If tests fail and you need help:

1. Check test output for specific error messages
2. Review troubleshooting section above
3. Verify database connection: `psql $TEST_DATABASE_URL`
4. Check Prisma schema matches database: `npx prisma db pull`
5. Review test logs for detailed failure information

---

**Remember:** These tests protect production. If they fail, fix them before deploying!
