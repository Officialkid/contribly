import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { organizationContextMiddleware, requireChiefAdmin } from "../middleware/context.middleware";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// Query parameters validation schema
const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  action: z.string().optional(),
  userId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

/**
 * GET /api/organizations/:organizationId/audit-logs
 * Get paginated audit logs for an organization
 * Protected: CHIEF_ADMIN only
 */
router.get(
  "/organizations/:organizationId/audit-logs",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const organizationId = req.params.organizationId;
      
      // Validate query parameters
      const validation = auditLogQuerySchema.safeParse(req.query);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid query parameters",
          details: validation.error.errors,
        });
      }

      const { page, limit, action, userId, from, to } = validation.data;
      const skip = (page - 1) * limit;

      // Build filter conditions
      const where: any = {
        organizationId,
      };

      if (action) {
        where.action = action;
      }

      if (userId) {
        where.userId = userId;
      }

      if (from || to) {
        where.createdAt = {};
        if (from) {
          where.createdAt.gte = new Date(from);
        }
        if (to) {
          where.createdAt.lte = new Date(to);
        }
      }

      // Get total count for pagination
      const totalCount = await prisma.auditLog.count({ where });

      // Fetch audit logs with user information
      const auditLogs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      // Format response with readable user info
      const formattedLogs = auditLogs.map((log) => ({
        id: log.id,
        organizationId: log.organizationId,
        userId: log.userId,
        userName: log.user?.name || null,
        userEmail: log.user?.email || null,
        action: log.action,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      }));

      return res.json({
        success: true,
        auditLogs: formattedLogs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch audit logs",
      });
    }
  }
);

/**
 * GET /api/organizations/:organizationId/audit-logs/actions
 * Get list of available audit action types
 * Protected: CHIEF_ADMIN only
 */
router.get(
  "/organizations/:organizationId/audit-logs/actions",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const organizationId = req.params.organizationId;

      // Get distinct action types for this organization
      const actions = await prisma.auditLog.findMany({
        where: { organizationId },
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
      });

      return res.json({
        success: true,
        actions: actions.map((a) => a.action),
      });
    } catch (error) {
      console.error("Failed to fetch audit actions:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch audit actions",
      });
    }
  }
);

/**
 * GET /api/organizations/:organizationId/audit-logs/stats
 * Get audit log statistics
 * Protected: CHIEF_ADMIN only
 */
router.get(
  "/organizations/:organizationId/audit-logs/stats",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const organizationId = req.params.organizationId;

      // Get total count
      const totalCount = await prisma.auditLog.count({
        where: { organizationId },
      });

      // Get count by action type
      const actionCounts = await prisma.$queryRaw<
        Array<{ action: string; count: bigint }>
      >`
        SELECT action, COUNT(*) as count
        FROM "AuditLog"
        WHERE "organizationId" = ${organizationId}
        GROUP BY action
        ORDER BY count DESC
      `;

      // Get date range
      const dateRange = await prisma.auditLog.aggregate({
        where: { organizationId },
        _min: { createdAt: true },
        _max: { createdAt: true },
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentCount = await prisma.auditLog.count({
        where: {
          organizationId,
          createdAt: { gte: sevenDaysAgo },
        },
      });

      return res.json({
        success: true,
        stats: {
          totalLogs: totalCount,
          recentLogs: recentCount,
          oldestLog: dateRange._min.createdAt,
          newestLog: dateRange._max.createdAt,
          actionBreakdown: actionCounts.map((a) => ({
            action: a.action,
            count: Number(a.count),
          })),
        },
      });
    } catch (error) {
      console.error("Failed to fetch audit stats:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch audit statistics",
      });
    }
  }
);

export default router;
