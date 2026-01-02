import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuditLogInput {
  organizationId: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: any;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        details: input.details ? JSON.stringify(input.details) : null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw - audit logging should not fail the main operation
  }
}

export async function getAuditLogs(
  organizationId: string,
  filters?: {
    action?: string;
    userId?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
  }
) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        organizationId,
        action: filters?.action,
        userId: filters?.userId,
        resourceType: filters?.resourceType,
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      include: { user: { select: { email: true, name: true } } },
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
}
