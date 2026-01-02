import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createOrganization(userId: string, name: string) {
  const organization = await prisma.organization.create({
    data: {
      name,
      members: {
        create: {
          userId,
          role: "CHIEF_ADMIN",
        },
      },
    },
  });

  return { success: true, organization };
}

export async function listOrganizationsForUser(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: true,
    },
  });

  return {
    success: true,
    organizations: memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      role: m.role,
      createdAt: m.organization.createdAt,
      updatedAt: m.organization.updatedAt,
    })),
  };
}

export async function getOrganizationForUser(organizationId: string, userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: { organizationId, userId },
    include: {
      organization: true,
    },
  });

  if (!membership) {
    return { success: false, error: "Organization not found or access denied" };
  }

  return {
    success: true,
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      role: membership.role,
      createdAt: membership.organization.createdAt,
      updatedAt: membership.organization.updatedAt,
    },
  };
}
