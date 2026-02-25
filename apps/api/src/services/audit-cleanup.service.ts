import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Audit Log Cleanup Service
 * 
 * Handles deletion of old audit logs based on retention policy.
 * Used for compliance with data retention regulations and database maintenance.
 */

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  retentionDays: number;
  cutoffDate: Date;
  error?: string;
}

/**
 * Delete audit logs older than the specified retention period
 * 
 * @param retentionDays - Number of days to retain audit logs (default: 365)
 * @param organizationId - Optional: Cleanup logs for specific organization only
 * @returns CleanupResult with count of deleted records
 * 
 * Example:
 *   await cleanOldAuditLogs(365); // Delete logs older than 1 year
 *   await cleanOldAuditLogs(90, "org-123"); // Delete logs older than 90 days for specific org
 */
export async function cleanOldAuditLogs(
  retentionDays: number = 365,
  organizationId?: string
): Promise<CleanupResult> {
  try {
    // Validate retention days
    if (retentionDays < 1) {
      throw new Error("Retention days must be at least 1");
    }

    if (retentionDays < 90) {
      console.warn(
        `⚠️  WARNING: Retention period of ${retentionDays} days is less than recommended minimum of 90 days`
      );
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(
      `🗑️  Starting audit log cleanup: Deleting logs older than ${cutoffDate.toISOString()}`
    );

    // Build where clause
    const where: any = {
      createdAt: {
        lt: cutoffDate,
      },
    };

    if (organizationId) {
      where.organizationId = organizationId;
      console.log(`   Scoped to organization: ${organizationId}`);
    }

    // Count logs to be deleted (for logging purposes)
    const countToDelete = await prisma.auditLog.count({ where });

    if (countToDelete === 0) {
      console.log("   No audit logs to delete");
      return {
        success: true,
        deletedCount: 0,
        retentionDays,
        cutoffDate,
      };
    }

    console.log(`   Found ${countToDelete} audit logs to delete`);

    // Delete old audit logs
    const result = await prisma.auditLog.deleteMany({ where });

    console.log(`✅ Successfully deleted ${result.count} audit logs`);

    // Log the cleanup action itself (meta!)
    if (organizationId) {
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId: "SYSTEM",
          action: "AUDIT_LOGS_CLEANED",
          metadata: {
            retentionDays,
            cutoffDate: cutoffDate.toISOString(),
            deletedCount: result.count,
          },
          ipAddress: null,
        },
      });
    }

    return {
      success: true,
      deletedCount: result.count,
      retentionDays,
      cutoffDate,
    };
  } catch (error) {
    console.error("❌ Failed to clean audit logs:", error);
    return {
      success: false,
      deletedCount: 0,
      retentionDays,
      cutoffDate: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get audit log statistics before cleanup
 * 
 * @param retentionDays - Retention period to analyze
 * @param organizationId - Optional: Analyze specific organization only
 * @returns Statistics about what would be deleted
 */
export async function getCleanupPreview(
  retentionDays: number = 365,
  organizationId?: string
): Promise<{
  totalLogs: number;
  logsToDelete: number;
  logsToRetain: number;
  oldestLog: Date | null;
  cutoffDate: Date;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const where: any = organizationId ? { organizationId } : {};

  const totalLogs = await prisma.auditLog.count({ where });

  const logsToDelete = await prisma.auditLog.count({
    where: {
      ...where,
      createdAt: { lt: cutoffDate },
    },
  });

  const oldestLog = await prisma.auditLog.findFirst({
    where,
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  return {
    totalLogs,
    logsToDelete,
    logsToRetain: totalLogs - logsToDelete,
    oldestLog: oldestLog?.createdAt || null,
    cutoffDate,
  };
}

/**
 * Get audit log storage size estimate
 * 
 * @param organizationId - Optional: Get size for specific organization
 * @returns Estimated storage size in MB
 */
export async function getAuditLogStorageSize(
  organizationId?: string
): Promise<{
  logCount: number;
  estimatedSizeMB: number;
}> {
  const where: any = organizationId ? { organizationId } : {};

  const logCount = await prisma.auditLog.count({ where });

  // Rough estimate: ~500 bytes per log entry on average
  // (includes ID, timestamps, JSON metadata, etc.)
  const estimatedSizeMB = (logCount * 500) / 1024 / 1024;

  return {
    logCount,
    estimatedSizeMB: Math.round(estimatedSizeMB * 100) / 100,
  };
}
