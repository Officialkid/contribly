import express, { Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getOrCreateOnboarding,
  updateStep,
  getOnboardingStatus,
  completeOnboarding,
} from "../services/onboarding.service.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/onboarding/:organizationId
 * Get onboarding status for an organization
 * Requires: JWT auth, CHIEF_ADMIN of the organization
 */
router.get(
  "/:organizationId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      // Verify user is CHIEF_ADMIN of this organization
      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
      });

      if (!membership || membership.role !== "CHIEF_ADMIN") {
        return res.status(403).json({
          success: false,
          error: "Only CHIEF_ADMIN can view onboarding status",
        });
      }

      const status = await getOnboardingStatus(organizationId);

      // If no onboarding yet, create it
      if (!status) {
        const newStatus = await getOrCreateOnboarding(organizationId);
        return res.json({
          success: true,
          onboarding: newStatus,
        });
      }

      return res.json({
        success: true,
        onboarding: status,
      });
    } catch (error: any) {
      console.error("Error fetching onboarding status:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch onboarding status",
      });
    }
  }
);

/**
 * PATCH /api/onboarding/:organizationId/step
 * Manually update a specific onboarding step
 * Requires: JWT auth, CHIEF_ADMIN of the organization
 * Body: { step: number, field: string }
 */
router.patch(
  "/:organizationId/step",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const { step, field } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      // Validate input
      if (!step || !field) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: step, field",
        });
      }

      const validFields = [
        "orgProfileDone",
        "paymentSetupDone",
        "deptCreatedDone",
        "inviteSentDone",
      ];

      if (!validFields.includes(field)) {
        return res.status(400).json({
          success: false,
          error: `Invalid field. Must be one of: ${validFields.join(", ")}`,
        });
      }

      // Verify user is CHIEF_ADMIN of this organization
      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
      });

      if (!membership || membership.role !== "CHIEF_ADMIN") {
        return res.status(403).json({
          success: false,
          error: "Only CHIEF_ADMIN can update onboarding progress",
        });
      }

      const updated = await updateStep(organizationId, step, field, userId);

      return res.json({
        success: true,
        onboarding: updated,
      });
    } catch (error: any) {
      console.error("Error updating onboarding step:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to update onboarding step",
      });
    }
  }
);

/**
 * POST /api/onboarding/:organizationId/complete
 * Manually mark onboarding as complete (skip remaining steps)
 * Requires: JWT auth, CHIEF_ADMIN of the organization
 */
router.post(
  "/:organizationId/complete",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }

      // Verify user is CHIEF_ADMIN of this organization
      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId,
          },
        },
      });

      if (!membership || membership.role !== "CHIEF_ADMIN") {
        return res.status(403).json({
          success: false,
          error: "Only CHIEF_ADMIN can complete onboarding",
        });
      }

      const completed = await completeOnboarding(organizationId, userId);

      return res.json({
        success: true,
        onboarding: completed,
      });
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to complete onboarding",
      });
    }
  }
);

export default router;
