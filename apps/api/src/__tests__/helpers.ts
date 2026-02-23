/**
 * Test Helpers for Payment Lifecycle Integration Tests
 * Provides utilities for seeding test data and cleanup
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export interface TestData {
  organization: {
    id: string;
    name: string;
  };
  chiefAdmin: {
    id: string;
    email: string;
    password: string; // Plain text for testing
    token?: string;
  };
  department: {
    id: string;
    name: string;
    monthlyContribution: number;
  };
  member1: {
    id: string;
    email: string;
    password: string;
    paymentReference: string;
    token?: string;
  };
  member2: {
    id: string;
    email: string;
    password: string;
    paymentReference: string;
    token?: string;
  };
}

/**
 * Seeds a complete test organization with users and department
 */
export async function seedTestData(): Promise<TestData> {
  const timestamp = Date.now();
  
  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: `Test Org ${timestamp}`,
    },
  });

  // Create chief admin user
  const chiefAdminPassword = "TestPassword123!";
  const chiefAdmin = await prisma.user.create({
    data: {
      email: `chiefadmin${timestamp}@test.com`,
      name: "Chief Admin Test",
      passwordHash: await bcrypt.hash(chiefAdminPassword, 10),
    },
  });

  // Create chief admin organization membership
  await prisma.organizationMember.create({
    data: {
      userId: chiefAdmin.id,
      organizationId: organization.id,
      role: "CHIEF_ADMIN",
    },
  });

  // Create department
  const department = await prisma.department.create({
    data: {
      name: `Test Department ${timestamp}`,
      organizationId: organization.id,
      monthlyContribution: 10000, // KES 100.00
    },
  });

  // Create member 1
  const member1Password = "Member1Pass123!";
  const member1 = await prisma.user.create({
    data: {
      email: `member1${timestamp}@test.com`,
      name: "Member One",
      passwordHash: await bcrypt.hash(member1Password, 10),
    },
  });

  // Create member 1 organization membership
  await prisma.organizationMember.create({
    data: {
      userId: member1.id,
      organizationId: organization.id,
      role: "MEMBER",
    },
  });

  // Create member 1 department membership with payment reference
  const member1Reference = `REF-M1-${timestamp}`;
  await prisma.departmentMember.create({
    data: {
      userId: member1.id,
      departmentId: department.id,
      paymentReference: member1Reference,
    },
  });

  // Create member 2
  const member2Password = "Member2Pass123!";
  const member2 = await prisma.user.create({
    data: {
      email: `member2${timestamp}@test.com`,
      name: "Member Two",
      passwordHash: await bcrypt.hash(member2Password, 10),
    },
  });

  // Create member 2 organization membership
  await prisma.organizationMember.create({
    data: {
      userId: member2.id,
      organizationId: organization.id,
      role: "MEMBER",
    },
  });

  // Create member 2 department membership with payment reference
  const member2Reference = `REF-M2-${timestamp}`;
  await prisma.departmentMember.create({
    data: {
      userId: member2.id,
      departmentId: department.id,
      paymentReference: member2Reference,
    },
  });

  return {
    organization: {
      id: organization.id,
      name: organization.name,
    },
    chiefAdmin: {
      id: chiefAdmin.id,
      email: `chiefadmin${timestamp}@test.com`,
      password: chiefAdminPassword,
    },
    department: {
      id: department.id,
      name: department.name,
      monthlyContribution: 10000,
    },
    member1: {
      id: member1.id,
      email: `member1${timestamp}@test.com`,
      password: member1Password,
      paymentReference: member1Reference,
    },
    member2: {
      id: member2.id,
      email: `member2${timestamp}@test.com`,
      password: member2Password,
      paymentReference: member2Reference,
    },
  };
}

/**
 * Cleans up all test data created by seedTestData
 */
export async function cleanupTestData(testData: TestData): Promise<void> {
  try {
    // Delete in reverse order of creation to respect foreign keys
    
    // Delete department members
    await prisma.departmentMember.deleteMany({
      where: {
        departmentId: testData.department.id,
      },
    });

    // Delete payments and related data
    await prisma.payment.deleteMany({
      where: {
        organizationId: testData.organization.id,
      },
    });

    // Delete payment claims
    await prisma.paymentClaim.deleteMany({
      where: {
        userId: {
          in: [testData.member1.id, testData.member2.id],
        },
      },
    });

    // Delete withdrawals and related OTPs
    await prisma.withdrawal.deleteMany({
      where: {
        departmentId: testData.department.id,
      },
    });

    await prisma.withdrawalOTP.deleteMany({
      where: {
        userId: {
          in: [testData.chiefAdmin.id, testData.member1.id, testData.member2.id],
        },
      },
    });

    // Delete department
    await prisma.department.delete({
      where: { id: testData.department.id },
    });

    // Delete organization members
    await prisma.organizationMember.deleteMany({
      where: {
        organizationId: testData.organization.id,
      },
    });

    // Delete users
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            testData.chiefAdmin.id,
            testData.member1.id,
            testData.member2.id,
          ],
        },
      },
    });

    // Delete organization
    await prisma.organization.delete({
      where: { id: testData.organization.id },
    });

    console.log("✅ Test data cleaned up successfully");
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
    throw error;
  }
}

/**
 * Disconnects Prisma client
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Gets Prisma client instance for direct database operations in tests
 */
export function getPrisma(): PrismaClient {
  return prisma;
}

/**
 * Helper to generate auth token for testing (mock JWT)
 */
export function generateTestToken(userId: string): string {
  // In real implementation, this would use jsonwebtoken
  // For now, return a simple identifier
  return `test-token-${userId}`;
}
