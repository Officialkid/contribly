/**
 * Payment Lifecycle Integration Tests
 * 
 * Tests the complete payment flow from recording payments through matching,
 * balance calculations, claims, and withdrawals.
 * 
 * Flow: Record Payment → Match to Member → Balance Recalculates → Member Sees Updated Balance
 */

import request from "supertest";
import express from "express";
import {
  seedTestData,
  cleanupTestData,
  disconnectPrisma,
  getPrisma,
  type TestData,
} from "./helpers.js";

// Import app setup (we'll need to export app from index.ts)
let app: express.Application;
let testData: TestData;
let chiefAdminToken: string;
let member1Token: string;
let member2Token: string;

const prisma = getPrisma();

/**
 * Setup: Create test data before all tests
 */
beforeAll(async () => {
  console.log("\n🧪 Setting up payment lifecycle integration tests...");
  
  // Seed test data
  testData = await seedTestData();
  console.log("✅ Test data seeded");

  // Create Express app for testing
  // We'll create a minimal app that loads our routes
  app = express();
  app.use(express.json());

  // Import and mount routes
  const { default: authRoutes } = await import("../routes/auth.routes.js");
  const { default: organizationRoutes } = await import("../routes/organization.routes.js");
  const { default: paymentRoutes } = await import("../routes/payment.routes.js");
  const { default: claimRoutes } = await import("../routes/claim.routes.js");

  app.use("/api/auth", authRoutes);
  app.use("/api", organizationRoutes);
  app.use("/api", paymentRoutes);
  app.use("/api", claimRoutes);

  // Login users to get tokens
  const chiefAdminLogin = await request(app)
    .post("/api/auth/login")
    .send({
      email: testData.chiefAdmin.email,
      password: testData.chiefAdmin.password,
    });
  
  if (chiefAdminLogin.status !== 200) {
    throw new Error(`Failed to login chief admin: ${JSON.stringify(chiefAdminLogin.body)}`);
  }
  
  // Extract token from cookie
  const chiefAdminCookie = chiefAdminLogin.headers["set-cookie"];
  chiefAdminToken = chiefAdminCookie?.[0]?.split(";")[0].split("=")[1] || "";

  const member1Login = await request(app)
    .post("/api/auth/login")
    .send({
      email: testData.member1.email,
      password: testData.member1.password,
    });
  
  const member1Cookie = member1Login.headers["set-cookie"];
  member1Token = member1Cookie?.[0]?.split(";")[0].split("=")[1] || "";

  const member2Login = await request(app)
    .post("/api/auth/login")
    .send({
      email: testData.member2.email,
      password: testData.member2.password,
    });
  
  const member2Cookie = member2Login.headers["set-cookie"];
  member2Token = member2Cookie?.[0]?.split(";")[0].split("=")[1] || "";

  console.log("✅ Test users authenticated");
});

/**
 * Cleanup: Remove test data after all tests
 */
afterAll(async () => {
  console.log("\n🧹 Cleaning up test data...");
  await cleanupTestData(testData);
  await disconnectPrisma();
  console.log("✅ Cleanup complete");
});

/**
 * Helper: Set auth cookie for requests
 */
function withAuth(req: request.Test, token: string): request.Test {
  return req.set("Cookie", [`token=${token}`]);
}

describe("Payment Lifecycle Integration Tests", () => {
  /**
   * SCENARIO A: Happy Path Manual Payment Match
   * 
   * Flow:
   * 1. Admin records a payment of 10000 for member 1
   * 2. System matches payment to member 1 by reference
   * 3. Fetch member 1 balance — assert monthsCleared = 1
   * 4. Fetch member 2 balance — assert monthsCleared = 0
   */
  describe("Scenario A: Happy Path Manual Payment Match", () => {
    let paymentId: string;

    it("should allow admin to record a payment for member 1", async () => {
      const response = await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/payments`)
          .send({
            amount: 10000, // KES 100.00
            paymentMethod: "M-PESA",
            transactionCode: `MPESA-${Date.now()}`,
            paymentDate: new Date().toISOString(),
            paidBy: "Member One",
            reference: testData.member1.paymentReference,
          }),
        chiefAdminToken
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.payment.amount).toBe(10000);
      
      paymentId = response.body.payment.id;
    });

    it("should automatically match payment to member 1 by reference", async () => {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          departmentMember: {
            include: {
              user: true,
            },
          },
        },
      });

      expect(payment).toBeDefined();
      expect(payment?.status).toBe("MATCHED");
      expect(payment?.departmentMember?.userId).toBe(testData.member1.id);
    });

    it("should show member 1 with monthsCleared = 1", async () => {
      const response = await withAuth(
        request(app)
          .get(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/members/${testData.member1.id}/balance`),
        chiefAdminToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.balance).toBeDefined();
      expect(response.body.balance.monthsCleared).toBe(1);
      expect(response.body.balance.totalPaid).toBe(10000);
    });

    it("should show member 2 with monthsCleared = 0", async () => {
      const response = await withAuth(
        request(app)
          .get(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/members/${testData.member2.id}/balance`),
        chiefAdminToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.balance).toBeDefined();
      expect(response.body.balance.monthsCleared).toBe(0);
      expect(response.body.balance.totalPaid).toBe(0);
    });
  });

  /**
   * SCENARIO B: Overpayment Carry Forward
   * 
   * Flow:
   * 1. Admin records a payment of 25000 for member 1 (2.5x monthly)
   * 2. Fetch member 1 balance
   * 3. Assert monthsCleared = 2 (total: 1 from scenario A + 2 from this)
   * 4. Assert carryForward = 5000
   */
  describe("Scenario B: Overpayment Carry Forward", () => {
    it("should record an overpayment for member 1", async () => {
      const response = await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/payments`)
          .send({
            amount: 25000, // KES 250.00 (2.5 months)
            paymentMethod: "BANK_TRANSFER",
            transactionCode: `BANK-${Date.now()}`,
            paymentDate: new Date().toISOString(),
            paidBy: "Member One",
            reference: testData.member1.paymentReference,
          }),
        chiefAdminToken
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.payment.amount).toBe(25000);
    });

    it("should calculate monthsCleared = 3 and carryForward = 5000", async () => {
      const response = await withAuth(
        request(app)
          .get(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/members/${testData.member1.id}/balance`),
        chiefAdminToken
      );

      expect(response.status).toBe(200);
      expect(response.body.balance.totalPaid).toBe(35000); // 10000 + 25000
      expect(response.body.balance.monthsCleared).toBe(3); // 35000 / 10000 = 3
      expect(response.body.balance.carryForward).toBe(5000); // 35000 % 10000 = 5000
    });
  });

  /**
   * SCENARIO C: Unmatched Payment and Claim Flow
   * 
   * Flow:
   * 1. Admin records payment with unrecognized reference
   * 2. Assert payment status = UNMATCHED
   * 3. Member 2 submits a claim for this payment
   * 4. Assert claim status = PENDING
   * 5. Admin approves the claim
   * 6. Assert payment status = MATCHED
   * 7. Assert member 2 monthsCleared = 1
   */
  describe("Scenario C: Unmatched Payment and Claim Flow", () => {
    let unmatchedPaymentId: string;
    let transactionCode: string;
    let claimId: string;

    it("should create an unmatched payment", async () => {
      transactionCode = `UNMATCHED-${Date.now()}`;
      
      const response = await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/payments`)
          .send({
            amount: 10000,
            paymentMethod: "M-PESA",
            transactionCode: transactionCode,
            paymentDate: new Date().toISOString(),
            paidBy: "Unknown Person",
            reference: "INVALID-REFERENCE-12345",
          }),
        chiefAdminToken
      );

      expect(response.status).toBe(201);
      expect(response.body.payment.status).toBe("UNMATCHED");
      
      unmatchedPaymentId = response.body.payment.id;
    });

    it("should allow member 2 to submit a claim for the unmatched payment", async () => {
      const response = await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/claims`)
          .send({
            transactionCode: transactionCode,
            amount: 10000,
            paymentDate: new Date().toISOString(),
            paymentMethod: "M-PESA",
            notes: "This is my payment, the reference was incorrect",
          }),
        member2Token
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.claim).toBeDefined();
      expect(response.body.claim.status).toBe("PENDING");
      
      claimId = response.body.claim.id;
    });

    it("should allow admin to approve the claim", async () => {
      const response = await withAuth(
        request(app)
          .patch(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/claims/${claimId}`)
          .send({
            status: "APPROVED",
            adminNotes: "Verified via bank statement",
          }),
        chiefAdminToken
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.claim.status).toBe("APPROVED");
    });

    it("should update payment status to MATCHED after claim approval", async () => {
      const payment = await prisma.payment.findUnique({
        where: { id: unmatchedPaymentId },
      });

      expect(payment?.status).toBe("MATCHED");
    });

    it("should show member 2 with monthsCleared = 1", async () => {
      const response = await withAuth(
        request(app)
          .get(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/members/${testData.member2.id}/balance`),
        chiefAdminToken
      );

      expect(response.status).toBe(200);
      expect(response.body.balance.monthsCleared).toBe(1);
      expect(response.body.balance.totalPaid).toBe(10000);
    });
  });

  /**
   * SCENARIO D: Withdrawal Flow
   * 
   * Flow:
   * 1. Record and match 3 months of payments for member 1 (30000 total)
   * 2. Admin requests withdrawal of 20000
   * 3. Assert withdrawal status = PENDING_APPROVAL
   * 4. Chief Admin approves (mock OTP/PIN)
   * 5. Assert withdrawal status = COMPLETED
   * 6. Assert department balance reduced by 20000
   */
  describe("Scenario D: Withdrawal Flow", () => {
    let withdrawalId: string;
    let initialDepartmentBalance: number;

    it("should record 3 additional payments for member 1", async () => {
      // Payment 1
      await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/payments`)
          .send({
            amount: 10000,
            paymentMethod: "M-PESA",
            transactionCode: `MP-${Date.now()}-1`,
            paymentDate: new Date().toISOString(),
            paidBy: "Member One",
            reference: testData.member1.paymentReference,
          }),
        chiefAdminToken
      );

      // Payment 2
      await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/payments`)
          .send({
            amount: 10000,
            paymentMethod: "M-PESA",
            transactionCode: `MP-${Date.now()}-2`,
            paymentDate: new Date().toISOString(),
            paidBy: "Member One",
            reference: testData.member1.paymentReference,
          }),
        chiefAdminToken
      );

      // Payment 3
      const response = await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/payments`)
          .send({
            amount: 10000,
            paymentMethod: "M-PESA",
            transactionCode: `MP-${Date.now()}-3`,
            paymentDate: new Date().toISOString(),
            paidBy: "Member One",
            reference: testData.member1.paymentReference,
          }),
        chiefAdminToken
      );

      expect(response.status).toBe(201);
    });

    it("should get current department balance", async () => {
      const response = await withAuth(
        request(app)
          .get(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/balance`),
        chiefAdminToken
      );

      expect(response.status).toBe(200);
      initialDepartmentBalance = response.body.balance.totalBalance;
      expect(initialDepartmentBalance).toBeGreaterThanOrEqual(20000);
    });

    it("should allow admin to request a withdrawal", async () => {
      const response = await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/withdrawals`)
          .send({
            amount: 20000,
            reason: "Office supplies",
          }),
        chiefAdminToken
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.withdrawal.status).toBe("PENDING_APPROVAL");
      expect(response.body.withdrawal.amount).toBe(20000);
      
      withdrawalId = response.body.withdrawal.id;
    });

    it("should allow chief admin to approve withdrawal (mock OTP/PIN)", async () => {
      // First, generate OTP
      const otpResponse = await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/withdrawals/${withdrawalId}/request-otp`),
        chiefAdminToken
      );

      expect(otpResponse.status).toBe(200);

      // Get the OTP from database (in real flow, sent via SMS/email)
      const otpRecord = await prisma.withdrawalOTP.findFirst({
        where: {
          userId: testData.chiefAdmin.id,
          withdrawalId: withdrawalId,
        },
        orderBy: { createdAt: "desc" },
      });

      expect(otpRecord).toBeDefined();

      // Approve with OTP and PIN
      const approveResponse = await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/withdrawals/${withdrawalId}/approve`)
          .send({
            otp: otpRecord?.otp,
            pin: "1234", // Mock PIN
          }),
        chiefAdminToken
      );

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.success).toBe(true);
      expect(approveResponse.body.withdrawal.status).toBe("COMPLETED");
    });

    it("should reduce department balance by 20000", async () => {
      const response = await withAuth(
        request(app)
          .get(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/balance`),
        chiefAdminToken
      );

      expect(response.status).toBe(200);
      const newBalance = response.body.balance.totalBalance;
      expect(newBalance).toBe(initialDepartmentBalance - 20000);
    });
  });

  /**
   * SCENARIO E: Overdraft Prevention
   * 
   * Flow:
   * 1. Attempt to create withdrawal larger than department balance
   * 2. Assert API returns 400 with error message
   * 3. Assert no withdrawal record was created
   */
  describe("Scenario E: Overdraft Prevention", () => {
    let initialWithdrawalCount: number;

    it("should get current withdrawal count", async () => {
      const withdrawals = await prisma.withdrawal.findMany({
        where: { departmentId: testData.department.id },
      });
      initialWithdrawalCount = withdrawals.length;
    });

    it("should reject withdrawal larger than department balance", async () => {
      // Get current balance
      const balanceResponse = await withAuth(
        request(app)
          .get(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/balance`),
        chiefAdminToken
      );

      const currentBalance = balanceResponse.body.balance.totalBalance;
      const overdraftAmount = currentBalance + 100000; // Way more than available

      // Attempt withdrawal
      const response = await withAuth(
        request(app)
          .post(`/api/organizations/${testData.organization.id}/departments/${testData.department.id}/withdrawals`)
          .send({
            amount: overdraftAmount,
            reason: "Trying to overdraft",
          }),
        chiefAdminToken
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/insufficient.*balance|exceeds.*available/i);
    });

    it("should not create a withdrawal record for rejected request", async () => {
      const withdrawals = await prisma.withdrawal.findMany({
        where: { departmentId: testData.department.id },
      });
      
      expect(withdrawals.length).toBe(initialWithdrawalCount);
    });
  });
});
