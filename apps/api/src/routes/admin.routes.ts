import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth.middleware.js";
import { z } from "zod";
import {
  organizationContextMiddleware,
  requireChiefAdmin,
} from "../middleware/context.middleware.js";
import {
  cleanOldAuditLogs,
  getCleanupPreview,
  getAuditLogStorageSize,
} from "../services/audit-cleanup.service.js";

const router = Router();

const cleanupRequestSchema = z.object({
  retentionDays: z.number().int().min(1).max(3650),
  preview: z.boolean().optional().default(false),
});

/**
 * POST /api/organizations/:organizationId/admin/audit-logs/cleanup
 * Protected: CHIEF_ADMIN scoped to the organization in the route
 */
router.post(
  "/organizations/:organizationId/admin/audit-logs/cleanup",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const validation = cleanupRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid request body",
          details: validation.error.errors,
        });
      }

      const { retentionDays, preview } = validation.data;
      const organizationId = req.organizationContext!.organizationId;
      const actorUserId = req.user!.userId;

      if (preview) {
        const previewResult = await getCleanupPreview(retentionDays, organizationId);

        return res.json({
          success: true,
          preview: true,
          retentionDays,
          organizationId,
          ...previewResult,
          message: `Preview: Would delete ${previewResult.logsToDelete} logs older than ${previewResult.cutoffDate.toISOString()}`,
        });
      }

      const result = await cleanOldAuditLogs(retentionDays, organizationId, actorUserId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || "Cleanup failed",
        });
      }

      return res.json({
        success: true,
        deletedCount: result.deletedCount,
        retentionDays: result.retentionDays,
        cutoffDate: result.cutoffDate,
        organizationId,
        message: `Successfully deleted ${result.deletedCount} audit logs`,
      });
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
 * GET /api/organizations/:organizationId/admin/audit-logs/storage
 * Protected: CHIEF_ADMIN scoped to the organization in the route
 */
router.get(
  "/organizations/:organizationId/admin/audit-logs/storage",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const organizationId = req.organizationContext!.organizationId;
      const storageInfo = await getAuditLogStorageSize(organizationId);

      return res.json({
        success: true,
        organizationId,
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
