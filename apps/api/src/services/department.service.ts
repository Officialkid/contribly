import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateUniquePaymentReference(departmentId: string): Promise<string> {
  while (true) {
    const ref = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const existing = await prisma.departmentMember.findFirst({
      where: { departmentId, paymentReference: ref },
      select: { id: true },
    });
    if (!existing) return ref;
  }
}

export async function createDepartment(
  organizationId: string,
  name: string,
  monthlyContribution: string | null,
  creatorUserId: string
) {
  const department = await prisma.department.create({
    data: {
      organizationId,
      name,
      monthlyContribution: monthlyContribution ? monthlyContribution : null,
    },
  });

  // Ensure creator is a department admin member for management
  const paymentReference = await generateUniquePaymentReference(department.id);
  await prisma.departmentMember.upsert({
    where: {
      userId_departmentId: {
        userId: creatorUserId,
        departmentId: department.id,
      },
    },
    update: {
      role: "ADMIN",
      paymentReference,
    },
    create: {
      userId: creatorUserId,
      departmentId: department.id,
      role: "ADMIN",
      paymentReference,
    },
  });

  return { success: true, department };
}

export async function updateDepartment(
  departmentId: string,
  organizationId: string,
  name?: string,
  monthlyContribution?: string | null
) {
  const department = await prisma.department.findFirst({ where: { id: departmentId, organizationId } });
  if (!department) {
    return { success: false, error: "Department not found in organization" };
  }

  const updated = await prisma.department.update({
    where: { id: departmentId },
    data: {
      name: name ?? department.name,
      monthlyContribution: monthlyContribution === undefined ? department.monthlyContribution : monthlyContribution,
    },
  });

  return { success: true, department: updated };
}

export async function listDepartments(organizationId: string) {
  const departments = await prisma.department.findMany({
    where: { organizationId },
    include: {
      members: {
        select: { userId: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    success: true,
    departments: departments.map((d) => ({
      id: d.id,
      name: d.name,
      monthlyContribution: d.monthlyContribution,
      organizationId: d.organizationId,
      memberCount: d.members.length,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
  };
}

export async function assignDepartmentAdmin(
  organizationId: string,
  departmentId: string,
  targetUserId: string
) {
  const department = await prisma.department.findFirst({ where: { id: departmentId, organizationId } });
  if (!department) {
    return { success: false, error: "Department not found in organization" };
  }

  const orgMember = await prisma.organizationMember.findFirst({
    where: { organizationId, userId: targetUserId },
  });
  if (!orgMember) {
    return { success: false, error: "Target user is not in this organization" };
  }

  const paymentReference = await generateUniquePaymentReference(departmentId);
  const membership = await prisma.departmentMember.upsert({
    where: {
      userId_departmentId: { userId: targetUserId, departmentId },
    },
    update: {
      role: "ADMIN",
      paymentReference,
    },
    create: {
      userId: targetUserId,
      departmentId,
      role: "ADMIN",
      paymentReference,
    },
  });

  return { success: true, membership };
}

export async function removeDepartmentAdmin(
  organizationId: string,
  departmentId: string,
  targetUserId: string
) {
  const department = await prisma.department.findFirst({ where: { id: departmentId, organizationId } });
  if (!department) {
    return { success: false, error: "Department not found in organization" };
  }

  const membership = await prisma.departmentMember.findFirst({
    where: { departmentId, userId: targetUserId },
  });

  if (!membership) {
    return { success: false, error: "User is not a member of this department" };
  }

  const updated = await prisma.departmentMember.update({
    where: { id: membership.id },
    data: { role: "MEMBER" as any },
  });

  return { success: true, membership: updated };
}
