/**
 * Onboarding Flow Integration Tests
 * 
 * Tests the complete onboarding system including:
 * - Auto-creation of onboarding records
 * - Step progression and validation
 * - Full flow completion
 * - Skip to complete functionality
 * - Persistence of onboarding state
 * - Access control and authorization
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
import crypto from "crypto";
import bcrypt from "bcrypt";

let app: express.Application;
let testData: TestData;
let chiefAdminToken: string;
let member1Token: string;

const prisma = getPrisma();

/**
 * Setup: Create test data before all tests
 */
beforeAll(async () => {
  console.log("\n🧪 Setting up onboarding integration tests...");
  
  // Seed test data
  testData = await seedTestData();
  console.log("✅ Test data seeded");

  // Create Express app for testing
  app = express();
  app.use(express.json());

  // Import and mount routes
  const { default: authRoutes } = await import("../routes/auth.routes.js");
  const { default: organizationRoutes } = await import("../routes/organization.routes.js");
  const { default: onboardingRoutes } = await import("../routes/onboarding.routes.js");

  app.use("/api/auth", authRoutes);
  app.use("/api", organizationRoutes);
  app.use("/api/onboarding", onboardingRoutes);

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

describe("Onboarding Integration Tests", () => {
  
  /**
   * TEST SUITE A — Onboarding Auto-Creation
   * 
   * Verify that creating a new organization automatically creates an onboarding record
   * with default values (step 1, not complete, all steps false)
   */
  describe("Suite A: Onboarding Auto-Creation", () => {
    let newOrgId: string;

    afterEach(async () => {
      // Cleanup newly created organization
      if (newOrgId) {
        try {
          // Delete onboarding progress
          await prisma.onboardingProgress.deleteMany({
            where: { organizationId: newOrgId },
          });
          // Delete organization member
          await prisma.organizationMember.deleteMany({
            where: { organizationId: newOrgId },
          });
          // Delete organization
          await prisma.organization.delete({
            where: { id: newOrgId },
          });
        } catch (err) {
          console.error("Error cleaning up new org:", err);
        }
      }
    });

    test("should auto-create onboarding record when organization is created", async () => {
      // Create a new organization
      const createOrgResponse = await withAuth(
        request(app)
          .post("/api/organizations")
          .send({
            name: `Auto-Created Org ${Date.now()}`,
          }),
        chiefAdminToken
      );

      expect(createOrgResponse.status).toBe(201);
      expect(createOrgResponse.body.success).toBe(true);
      expect(createOrgResponse.body.organization).toBeDefined();
      
      newOrgId = createOrgResponse.body.organization.id;

      // Immediately fetch onboarding status
      const onboardingResponse = await withAuth(
        request(app).get(`/api/onboarding/${newOrgId}`),
        chiefAdminToken
      );

      expect(onboardingResponse.status).toBe(200);
      expect(onboardingResponse.body.success).toBe(true);
      expect(onboardingResponse.body.onboarding).toBeDefined();

      const onboarding = onboardingResponse.body.onboarding;

      // Assert: onboarding record exists
      expect(onboarding.id).toBeDefined();
      expect(onboarding.organizationId).toBe(newOrgId);

      // Assert: currentStep === 1
      expect(onboarding.currentStep).toBe(1);

      // Assert: isComplete === false
      expect(onboarding.isComplete).toBe(false);

      // Assert: all step fields are false
      expect(onboarding.orgProfileDone).toBe(false);
      expect(onboarding.paymentSetupDone).toBe(false);
      expect(onboarding.deptCreatedDone).toBe(false);
      expect(onboarding.inviteSentDone).toBe(false);

      // Assert: completedSteps is empty array
      expect(onboarding.completedSteps).toEqual([]);

      // Assert: completedAt is null
      expect(onboarding.completedAt).toBeNull();

      // Assert: percentComplete is 0
      expect(onboarding.percentComplete).toBe(0);
    });
  });

  /**
   * TEST SUITE B — Step Progression
   * 
   * Verify that marking a step complete updates the onboarding state correctly
   * (completedSteps array, currentStep advancement, specific step flag)
   */
  describe("Suite B: Step Progression", () => {
    test("should update onboarding when step 1 is marked complete", async () => {
      // Mark step 1 (orgProfileDone) as complete
      const updateResponse = await withAuth(
        request(app)
          .patch(`/api/onboarding/${testData.organization.id}/step`)
          .send({
            step: 1,
            field: "orgProfileDone",
          }),
        chiefAdminToken
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);

      // Fetch updated onboarding status
      const statusResponse = await withAuth(
        request(app).get(`/api/onboarding/${testData.organization.id}`),
        chiefAdminToken
      );

      expect(statusResponse.status).toBe(200);
      const onboarding = statusResponse.body.onboarding;

      // Assert: completedSteps includes 1
      expect(onboarding.completedSteps).toContain(1);

      // Assert: currentStep === 2
      expect(onboarding.currentStep).toBe(2);

      // Assert: orgProfileDone === true
      expect(onboarding.orgProfileDone).toBe(true);

      // Assert: percentComplete === 25 (1 out of 4 steps)
      expect(onboarding.percentComplete).toBe(25);

      // Assert: isComplete === false (not all steps done)
      expect(onboarding.isComplete).toBe(false);
    });

    test("should progress through multiple steps correctly", async () => {
      // Mark step 2 (paymentSetupDone) as complete
      const updateStep2 = await withAuth(
        request(app)
          .patch(`/api/onboarding/${testData.organization.id}/step`)
          .send({
            step: 2,
            field: "paymentSetupDone",
          }),
        chiefAdminToken
      );

      expect(updateStep2.status).toBe(200);

      // Fetch status
      const statusAfterStep2 = await withAuth(
        request(app).get(`/api/onboarding/${testData.organization.id}`),
        chiefAdminToken
      );

      const onboarding = statusAfterStep2.body.onboarding;

      // Assert: completedSteps includes 1 and 2
      expect(onboarding.completedSteps).toContain(1);
      expect(onboarding.completedSteps).toContain(2);

      // Assert: currentStep === 3
      expect(onboarding.currentStep).toBe(3);

      // Assert: paymentSetupDone === true
      expect(onboarding.paymentSetupDone).toBe(true);

      // Assert: percentComplete === 50 (2 out of 4 steps)
      expect(onboarding.percentComplete).toBe(50);
    });
  });

  /**
   * TEST SUITE C — Full Flow Completion
   * 
   * Verify that completing all 4 steps marks onboarding as complete
   * (isComplete = true, completedAt set, percentComplete = 100)
   */
  describe("Suite C: Full Flow Completion", () => {
    test("should mark onboarding complete after all 4 steps", async () => {
      // Steps 1 and 2 already completed in Suite B
      // Mark step 3 (deptCreatedDone) as complete
      const updateStep3 = await withAuth(
        request(app)
          .patch(`/api/onboarding/${testData.organization.id}/step`)
          .send({
            step: 3,
            field: "deptCreatedDone",
          }),
        chiefAdminToken
      );

      expect(updateStep3.status).toBe(200);

      // Mark step 4 (inviteSentDone) as complete
      const updateStep4 = await withAuth(
        request(app)
          .patch(`/api/onboarding/${testData.organization.id}/step`)
          .send({
            step: 4,
            field: "inviteSentDone",
          }),
        chiefAdminToken
      );

      expect(updateStep4.status).toBe(200);

      // Fetch final status
      const finalStatus = await withAuth(
        request(app).get(`/api/onboarding/${testData.organization.id}`),
        chiefAdminToken
      );

      const onboarding = finalStatus.body.onboarding;

      // Assert: isComplete === true
      expect(onboarding.isComplete).toBe(true);

      // Assert: completedAt is set (not null)
      expect(onboarding.completedAt).not.toBeNull();
      expect(new Date(onboarding.completedAt)).toBeInstanceOf(Date);

      // Assert: percentComplete === 100
      expect(onboarding.percentComplete).toBe(100);

      // Assert: all 4 steps are in completedSteps
      expect(onboarding.completedSteps).toContain(1);
      expect(onboarding.completedSteps).toContain(2);
      expect(onboarding.completedSteps).toContain(3);
      expect(onboarding.completedSteps).toContain(4);

      // Assert: all step flags are true
      expect(onboarding.orgProfileDone).toBe(true);
      expect(onboarding.paymentSetupDone).toBe(true);
      expect(onboarding.deptCreatedDone).toBe(true);
      expect(onboarding.inviteSentDone).toBe(true);
    });
  });

  /**
   * TEST SUITE D — Skip to Complete
   * 
   * Verify that the skip/complete endpoint marks onboarding as complete
   * even if not all steps are done
   */
  describe("Suite D: Skip to Complete", () => {
    let skipOrgId: string;
    let skipToken: string;

    beforeAll(async () => {
      // Create a new organization for skip testing
      const timestamp = Date.now();
      
      const skipOrg = await prisma.organization.create({
        data: {
          id: crypto.randomUUID(),
          name: `Skip Test Org ${timestamp}`,
          updatedAt: new Date(),
        },
      });
      skipOrgId = skipOrg.id;

      // Create a chief admin for this org
      const skipAdmin = await prisma.user.create({
        data: {
          email: `skipadmin${timestamp}@test.com`,
          name: "Skip Admin",
          passwordHash: await bcrypt.hash("SkipPassword123!", 10),
        },
      });

      await prisma.organizationMember.create({
        data: {
          userId: skipAdmin.id,
          organizationId: skipOrgId,
          role: "CHIEF_ADMIN",
        },
      });

      // Login to get token
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: `skipadmin${timestamp}@test.com`,
          password: "SkipPassword123!",
        });

      const cookie = loginResponse.headers["set-cookie"];
      skipToken = cookie?.[0]?.split(";")[0].split("=")[1] || "";
    });

    afterAll(async () => {
      // Cleanup skip test org
      try {
        await prisma.onboardingProgress.deleteMany({
          where: { organizationId: skipOrgId },
        });
        await prisma.organizationMember.deleteMany({
          where: { organizationId: skipOrgId },
        });
        await prisma.user.deleteMany({
          where: { email: { contains: "skipadmin" } },
        });
        await prisma.organization.delete({
          where: { id: skipOrgId },
        });
      } catch (err) {
        console.error("Error cleaning up skip test org:", err);
      }
    });

    test("should mark onboarding complete via complete endpoint", async () => {
      // Get initial onboarding status (should be at step 1, nothing done)
      const initialStatus = await withAuth(
        request(app).get(`/api/onboarding/${skipOrgId}`),
        skipToken
      );

      expect(initialStatus.status).toBe(200);
      expect(initialStatus.body.onboarding.isComplete).toBe(false);
      expect(initialStatus.body.onboarding.currentStep).toBe(1);

      // Call complete endpoint to skip remaining steps
      const completeResponse = await withAuth(
        request(app).post(`/api/onboarding/${skipOrgId}/complete`),
        skipToken
      );

      expect(completeResponse.status).toBe(200);
      expect(completeResponse.body.success).toBe(true);

      // Fetch updated status
      const finalStatus = await withAuth(
        request(app).get(`/api/onboarding/${skipOrgId}`),
        skipToken
      );

      const onboarding = finalStatus.body.onboarding;

      // Assert: isComplete === true
      expect(onboarding.isComplete).toBe(true);

      // Assert: completedAt is set
      expect(onboarding.completedAt).not.toBeNull();

      // Note: Steps may not all be marked done, but onboarding is complete
      // This is the "skip to complete" behavior
    });
  });

  /**
   * TEST SUITE E — Persistence
   * 
   * Verify that onboarding state persists correctly
   * (simulate closing and reopening by fetching again)
   */
  describe("Suite E: Persistence", () => {
    let persistOrgId: string;
    let persistToken: string;

    beforeAll(async () => {
      // Create a new organization for persistence testing
      const timestamp = Date.now();
      
      const persistOrg = await prisma.organization.create({
        data: {
          id: crypto.randomUUID(),
          name: `Persist Test Org ${timestamp}`,
          updatedAt: new Date(),
        },
      });
      persistOrgId = persistOrg.id;

      // Create a chief admin
      const persistAdmin = await prisma.user.create({
        data: {
          email: `persistadmin${timestamp}@test.com`,
          name: "Persist Admin",
          passwordHash: await bcrypt.hash("PersistPassword123!", 10),
        },
      });

      await prisma.organizationMember.create({
        data: {
          userId: persistAdmin.id,
          organizationId: persistOrgId,
          role: "CHIEF_ADMIN",
        },
      });

      // Login
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: `persistadmin${timestamp}@test.com`,
          password: "PersistPassword123!",
        });

      const cookie = loginResponse.headers["set-cookie"];
      persistToken = cookie?.[0]?.split(";")[0].split("=")[1] || "";
    });

    afterAll(async () => {
      // Cleanup
      try {
        await prisma.onboardingProgress.deleteMany({
          where: { organizationId: persistOrgId },
        });
        await prisma.organizationMember.deleteMany({
          where: { organizationId: persistOrgId },
        });
        await prisma.user.deleteMany({
          where: { email: { contains: "persistadmin" } },
        });
        await prisma.organization.delete({
          where: { id: persistOrgId },
        });
      } catch (err) {
        console.error("Error cleaning up persist test org:", err);
      }
    });

    test("should persist onboarding state across requests", async () => {
      // Mark step 2 as complete
      const updateResponse = await withAuth(
        request(app)
          .patch(`/api/onboarding/${persistOrgId}/step`)
          .send({
            step: 2,
            field: "paymentSetupDone",
          }),
        persistToken
      );

      expect(updateResponse.status).toBe(200);

      // Fetch status (first time)
      const firstFetch = await withAuth(
        request(app).get(`/api/onboarding/${persistOrgId}`),
        persistToken
      );

      const firstOnboarding = firstFetch.body.onboarding;

      // Assert initial state
      expect(firstOnboarding.paymentSetupDone).toBe(true);
      expect(firstOnboarding.completedSteps).toContain(2);
      expect(firstOnboarding.currentStep).toBe(3);

      // Simulate "closing and reopening" by fetching again
      const secondFetch = await withAuth(
        request(app).get(`/api/onboarding/${persistOrgId}`),
        persistToken
      );

      const secondOnboarding = secondFetch.body.onboarding;

      // Assert: step 2 is still marked complete
      expect(secondOnboarding.paymentSetupDone).toBe(true);
      expect(secondOnboarding.completedSteps).toContain(2);

      // Assert: currentStep is still correct
      expect(secondOnboarding.currentStep).toBe(3);

      // Assert: IDs match (same record)
      expect(firstOnboarding.id).toBe(secondOnboarding.id);

      // Assert: State is identical
      expect(secondOnboarding.orgProfileDone).toBe(firstOnboarding.orgProfileDone);
      expect(secondOnboarding.deptCreatedDone).toBe(firstOnboarding.deptCreatedDone);
      expect(secondOnboarding.inviteSentDone).toBe(firstOnboarding.inviteSentDone);
    });
  });

  /**
   * TEST SUITE F — Access Control
   * 
   * Verify that only CHIEF_ADMIN can access onboarding endpoints
   * and that unauthenticated requests are rejected
   */
  describe("Suite F: Access Control", () => {
    test("should return 403 for non-CHIEF_ADMIN member", async () => {
      // Try to access onboarding as a regular MEMBER
      const response = await withAuth(
        request(app).get(`/api/onboarding/${testData.organization.id}`),
        member1Token
      );

      // Assert: 403 Forbidden
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("CHIEF_ADMIN");
    });

    test("should return 401 for unauthenticated request", async () => {
      // Try to access onboarding without auth token
      const response = await request(app).get(
        `/api/onboarding/${testData.organization.id}`
      );

      // Assert: 401 Unauthorized
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test("should prevent non-CHIEF_ADMIN from updating steps", async () => {
      // Try to update onboarding step as a regular MEMBER
      const response = await withAuth(
        request(app)
          .patch(`/api/onboarding/${testData.organization.id}/step`)
          .send({
            step: 1,
            field: "orgProfileDone",
          }),
        member1Token
      );

      // Assert: 403 Forbidden
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should prevent non-CHIEF_ADMIN from completing onboarding", async () => {
      // Try to complete onboarding as a regular MEMBER
      const response = await withAuth(
        request(app).post(`/api/onboarding/${testData.organization.id}/complete`),
        member1Token
      );

      // Assert: 403 Forbidden
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test("should allow CHIEF_ADMIN to access all onboarding endpoints", async () => {
      // GET onboarding status
      const getResponse = await withAuth(
        request(app).get(`/api/onboarding/${testData.organization.id}`),
        chiefAdminToken
      );
      expect(getResponse.status).toBe(200);

      // PATCH update step
      const patchResponse = await withAuth(
        request(app)
          .patch(`/api/onboarding/${testData.organization.id}/step`)
          .send({
            step: 1,
            field: "orgProfileDone",
          }),
        chiefAdminToken
      );
      expect(patchResponse.status).toBe(200);

      // Note: POST complete already tested in Suite D
    });
  });
});
