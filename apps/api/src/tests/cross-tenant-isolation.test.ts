import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const API_BASE = process.env.API_BASE_URL || "http://localhost:3001";
const JWT_SECRET = process.env.JWT_SECRET || "test-secret-min-32-characters-long";

/**
 * CROSS-TENANT ISOLATION TEST SUITE
 * 
 * This suite verifies that users from Organization A cannot access
 * resources from Organization B through any API endpoint.
 * 
 * Test setup:
 * - Org A: Chief Admin A, Member A, Department A
 * - Org B: Chief Admin B, Member B, Department B
 * 
 * Test scenarios:
 * 1. Org A admin cannot access Org B resources
 * 2. Org A member cannot view Org B member data
 * 3. Invalid/expired JWT properly rejected
 * 4. Cross-organization payment/claim/withdrawal access blocked
 */

describe("Cross-Tenant Isolation Tests", () => {
  let orgA: any;
  let orgB: any;
  let chiefAdminA: any;
  let chiefAdminB: any;
  let memberA: any;
  let memberB: any;
  let deptA: any;
  let deptB: any;
  let tokenA: string;
  let tokenB: string;
  let tokenMemberA: string;
  let tokenMemberB: string;

  beforeAll(async () => {
    console.log("🧪 Setting up cross-tenant isolation test data...");

    // Create Organization A with users and department
    orgA = await prisma.organization.create({
      data: { name: "Test Organization A" },
    });

    const passwordHash = await bcrypt.hash("TestPassword123!", 10);

    chiefAdminA = await prisma.user.create({
      data: {
        email: "chiefadmin-a@test.com",
        name: "Chief Admin A",
        passwordHash,
      },
    });

    await prisma.organizationMember.create({
      data: {
        userId: chiefAdminA.id,
        organizationId: orgA.id,
        role: "CHIEF_ADMIN",
      },
    });

    deptA = await prisma.department.create({
      data: {
        name: "Department A",
        organizationId: orgA.id,
        monthlyContribution: 100,
      },
    });

    memberA = await prisma.user.create({
      data: {
        email: "member-a@test.com",
        name: "Member A",
        passwordHash,
      },
    });

    await prisma.organizationMember.create({
      data: {
        userId: memberA.id,
        organizationId: orgA.id,
        role: "MEMBER",
      },
    });

    await prisma.departmentMember.create({
      data: {
        userId: memberA.id,
        departmentId: deptA.id,
        role: "MEMBER",
      },
    });

    // Create Organization B with users and department
    orgB = await prisma.organization.create({
      data: { name: "Test Organization B" },
    });

    chiefAdminB = await prisma.user.create({
      data: {
        email: "chiefadmin-b@test.com",
        name: "Chief Admin B",
        passwordHash,
      },
    });

    await prisma.organizationMember.create({
      data: {
        userId: chiefAdminB.id,
        organizationId: orgB.id,
        role: "CHIEF_ADMIN",
      },
    });

    deptB = await prisma.department.create({
      data: {
        name: "Department B",
        organizationId: orgB.id,
        monthlyContribution: 100,
      },
    });

    memberB = await prisma.user.create({
      data: {
        email: "member-b@test.com",
        name: "Member B",
        passwordHash,
      },
    });

    await prisma.organizationMember.create({
      data: {
        userId: memberB.id,
        organizationId: orgB.id,
        role: "MEMBER",
      },
    });

    await prisma.departmentMember.create({
      data: {
        userId: memberB.id,
        departmentId: deptB.id,
        role: "MEMBER",
      },
    });

    // Generate JWT tokens
    tokenA = jwt.sign(
      { userId: chiefAdminA.id, email: chiefAdminA.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    tokenB = jwt.sign(
      { userId: chiefAdminB.id, email: chiefAdminB.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    tokenMemberA = jwt.sign(
      { userId: memberA.id, email: memberA.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    tokenMemberB = jwt.sign(
      { userId: memberB.id, email: memberB.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Test data setup complete");
    console.log(`   Org A (${orgA.id}): Chief Admin A, Member A, Department A`);
    console.log(`   Org B (${orgB.id}): Chief Admin B, Member B, Department B`);
  });

  afterAll(async () => {
    console.log("🧹 Cleaning up test data...");

    // Delete in reverse order of dependencies
    await prisma.departmentMember.deleteMany({
      where: {
        OR: [
          { userId: memberA.id },
          { userId: memberB.id },
        ],
      },
    });

    await prisma.department.deleteMany({
      where: { id: { in: [deptA.id, deptB.id] } },
    });

    await prisma.organizationMember.deleteMany({
      where: {
        organizationId: { in: [orgA.id, orgB.id] },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [chiefAdminA.id, chiefAdminB.id, memberA.id, memberB.id] },
      },
    });

    await prisma.organization.deleteMany({
      where: { id: { in: [orgA.id, orgB.id] } },
    });

    await prisma.$disconnect();
    console.log("✅ Cleanup complete");
  });

  describe("Organization Access Control", () => {
    it("should block Org A admin from accessing Org B organization details", async () => {
      const response = await fetch(`${API_BASE}/api/organizations/${orgB.id}`, {
        headers: {
          "Authorization": `Bearer ${tokenA}`,
        },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain("organization");
    });

    it("should allow Org A admin to access their own organization", async () => {
      const response = await fetch(`${API_BASE}/api/organizations/${orgA.id}`, {
        headers: {
          "Authorization": `Bearer ${tokenA}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.organization.id).toBe(orgA.id);
    });

    it("should block Org A admin from creating department in Org B", async () => {
      const response = await fetch(`${API_BASE}/api/organizations/${orgB.id}/departments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenA}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Malicious Department",
          monthlyContribution: 100,
        }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });

  describe("Payment Access Control", () => {
    let paymentB: any;

    beforeAll(async () => {
      // Create a payment in Org B
      paymentB = await prisma.payment.create({
        data: {
          organizationId: orgB.id,
          amount: "500.00",
          reference: "TEST-PAYMENT-B",
          transactionDate: new Date(),
          status: "UNMATCHED",
        },
      });
    });

    it("should block Org A admin from viewing Org B payments", async () => {
      const response = await fetch(`${API_BASE}/api/organizations/${orgB.id}/payments`, {
        headers: {
          "Authorization": `Bearer ${tokenA}`,
        },
      });

      expect(response.status).toBe(403);
    });

    it("should block Org A admin from matching Org B payment", async () => {
      const response = await fetch(
        `${API_BASE}/api/organizations/${orgB.id}/payments/${paymentB.id}/match`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokenA}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: memberB.id,
            departmentId: deptB.id,
          }),
        }
      );

      expect(response.status).toBe(403);
    });
  });

  describe("Member Balance Access Control", () => {
    it("should block Member A from viewing Member B balance", async () => {
      const response = await fetch(
        `${API_BASE}/api/organizations/${orgB.id}/departments/${deptB.id}/balance?userId=${memberB.id}`,
        {
          headers: {
            "Authorization": `Bearer ${tokenMemberA}`,
          },
        }
      );

      expect(response.status).toBe(403);
    });

    it("should allow Member A to view their own balance", async () => {
      const response = await fetch(
        `${API_BASE}/api/organizations/${orgA.id}/departments/${deptA.id}/balance?userId=${memberA.id}`,
        {
          headers: {
            "Authorization": `Bearer ${tokenMemberA}`,
          },
        }
      );

      expect(response.status).toBe(200);
    });

    it("should block Member A from viewing another member's balance in same organization", async () => {
      // Create another member in Org A
      const passwordHash = await bcrypt.hash("TestPassword123!", 10);
      const memberA2 = await prisma.user.create({
        data: {
          email: "member-a2@test.com",
          name: "Member A2",
          passwordHash,
        },
      });

      await prisma.organizationMember.create({
        data: {
          userId: memberA2.id,
          organizationId: orgA.id,
          role: "MEMBER",
        },
      });

      await prisma.departmentMember.create({
        data: {
          userId: memberA2.id,
          departmentId: deptA.id,
          role: "MEMBER",
        },
      });

      const response = await fetch(
        `${API_BASE}/api/organizations/${orgA.id}/departments/${deptA.id}/balance?userId=${memberA2.id}`,
        {
          headers: {
            "Authorization": `Bearer ${tokenMemberA}`,
          },
        }
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("own balance");

      // Cleanup
      await prisma.departmentMember.deleteMany({ where: { userId: memberA2.id } });
      await prisma.organizationMember.deleteMany({ where: { userId: memberA2.id } });
      await prisma.user.delete({ where: { id: memberA2.id } });
    });
  });

  describe("Withdrawal Access Control", () => {
    let withdrawalA: any;

    beforeAll(async () => {
      // Create a withdrawal request in Org A
      withdrawalA = await prisma.withdrawal.create({
        data: {
          departmentId: deptA.id,
          creatorId: memberA.id,
          amount: "200.00",
          reason: "Test withdrawal",
          status: "PENDING_APPROVAL",
        },
      });
    });

    it("should block Member B from verifying Member A OTP", async () => {
      const response = await fetch(
        `${API_BASE}/api/withdrawals/${withdrawalA.id}/verify-otp`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokenMemberB}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ otp: "123456" }),
        }
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("own withdrawal");
    });

    it("should block Org B admin from approving Org A withdrawal", async () => {
      const response = await fetch(
        `${API_BASE}/api/withdrawals/${withdrawalA.id}/approve`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokenB}`,
          },
        }
      );

      expect(response.status).toBe(403);
    });
  });

  describe("JWT Authentication", () => {
    it("should reject invalid JWT token", async () => {
      const response = await fetch(`${API_BASE}/api/organizations/${orgA.id}`, {
        headers: {
          "Authorization": "Bearer invalid-token-12345",
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("should reject expired JWT token", async () => {
      const expiredToken = jwt.sign(
        { userId: chiefAdminA.id, email: chiefAdminA.email },
        JWT_SECRET,
        { expiresIn: "-1h" } // Expired 1 hour ago
      );

      const response = await fetch(`${API_BASE}/api/organizations/${orgA.id}`, {
        headers: {
          "Authorization": `Bearer ${expiredToken}`,
        },
      });

      expect(response.status).toBe(401);
    });

    it("should reject requests with no authentication", async () => {
      const response = await fetch(`${API_BASE}/api/organizations/${orgA.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe("Self-Approval Prevention", () => {
    let selfWithdrawal: any;

    beforeAll(async () => {
      // Create a withdrawal by Chief Admin A
      selfWithdrawal = await prisma.withdrawal.create({
        data: {
          departmentId: deptA.id,
          creatorId: chiefAdminA.id,
          amount: "300.00",
          reason: "Self withdrawal test",
          status: "PENDING_APPROVAL",
        },
      });
    });

    it("should block Chief Admin from approving their own withdrawal", async () => {
      const response = await fetch(
        `${API_BASE}/api/withdrawals/${selfWithdrawal.id}/approve`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokenA}`,
          },
        }
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain("own withdrawal");
    });
  });
});
