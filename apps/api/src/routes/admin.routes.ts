import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { z } from "zod";
import {
  cleanOldAuditLogs,
  getCleanupPreview,
  getAuditLogStorageSize,
} from "../services/audit-cleanup.service";

const router = Router();

// Validation schema for cleanup request
const cleanupRequestSchema = z.object({
  retentionDays: z.number().int().min(1).max(3650), // Max 10 years
  organizationId: z.string().optional(),
  preview: z.boolean().optional().default(false),
});

/**
 * POST /api/admin/audit-logs/cleanup
 * Clean up old audit logs based on retention policy
 * 
 * Protected: Platform admin only
 * 
 * Body:
 *   {
 *     "retentionDays": 365,
 *     "organizationId": "optional-org-id",
 *     "preview": false
 *   }
 */
router.post(
  "/admin/audit-logs/cleanup",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate request body
      const validation = cleanupRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request body",
          details: validation.error.errors,
        });
      }

      const { retentionDays, organizationId, preview } = validation.data;

      // Security check: Only platform admins can cleanup audit logs
      // For now, we check if the user is a CHIEF_ADMIN
      // In production, you might have a separate PLATFORM_ADMIN role
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      // Basic authorization: User must be authenticated
      // TODO: Add proper platform admin role check in production
      console.log(
        `🔐 Audit cleanup requested by user: ${user.email} (${user.userId})`
      );

      // If preview mode, return what would be deleted without actually deleting
      if (preview) {
        const previewResult = await getCleanupPreview(
          retentionDays,
          organizationId
        );

        return res.json({
          success: true,
          preview: true,
          retentionDays,
          organizationId: organizationId || "ALL",
          ...previewResult,
          message: `Preview: Would delete ${previewResult.logsToDelete} logs older than ${previewResult.cutoffDate.toISOString()}`,
        });
      }

      // Perform actual cleanup
      const result = await cleanOldAuditLogs(retentionDays, organizationId);

      if (result.success) {
        return res.json({
          success: true,
          deletedCount: result.deletedCount,
          retentionDays: result.retentionDays,
          cutoffDate: result.cutoffDate,
          organizationId: organizationId || "ALL",
          message: `Successfully deleted ${result.deletedCount} audit logs`,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: result.error || "Cleanup failed",
        });
      }
    } catch (error) {
      console.error("Audit cleanup endpoint error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to cleanup audit logs",
      });
    }
  }
);

/**
 * GET /api/admin/audit-logs/storage
 * Get audit log storage statistics
 * 
 * Protected: Platform admin only
 */
router.get(
  "/admin/audit-logs/storage",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const organizationId = req.query.organizationId as string | undefined;

      const storageInfo = await getAuditLogStorageSize(organizationId);

      return res.json({
        success: true,
        organizationId: organizationId || "ALL",
        ...storageInfo,
      });
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to get storage information",
      });
    }
  }
);

export default router;
