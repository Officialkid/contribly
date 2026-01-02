import { Router, Response } from "express";
import {
  requestWithdrawal,
  approveWithdrawal,
  rejectWithdrawal,
  verifyWithdrawalOTP,
  resendWithdrawalOTP,
} from "../services/withdrawal.service.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import {
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireChiefAdmin,
  requireDepartmentMember,
} from "../middleware/context.middleware.js";
import { getUserContext } from "../utils/context.js";

const router = Router();

// REQUEST WITHDRAWAL
router.post(
  "/withdrawals",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentMember,
  async (req: AuthRequest, res: Response) => {
    try {
      const context = getUserContext(req);
      if (!context) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { amount, reason } = req.body;

      if (!req.departmentContext || !amount || !reason) {
        return res.status(400).json({
          success: false,
          error: "departmentId (header), amount, and reason are required",
        });
      }

      const result = await requestWithdrawal(
        req.departmentContext.departmentId,
        context.userId,
        amount,
        reason,
        context.organizationId
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  }
);

// APPROVE WITHDRAWAL (Chief Admin only)
router.post(
  "/withdrawals/:id/approve",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const context = getUserContext(req);
      if (!context) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const result = await approveWithdrawal(req.params.id, context.userId, context.organizationId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  }
);

// REJECT WITHDRAWAL (Chief Admin only)
router.post(
  "/withdrawals/:id/reject",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const context = getUserContext(req);
      if (!context) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { reason } = req.body;

      const result = await rejectWithdrawal(
        req.params.id,
        context.userId,
        context.organizationId,
        reason
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  }
);

// VERIFY OTP FOR WITHDRAWAL
router.post(
  "/withdrawals/:id/verify-otp",
  authMiddleware,
  organizationContextMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const context = getUserContext(req);
      if (!context) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { otp } = req.body;

      if (!otp) {
        return res.status(400).json({ success: false, error: "OTP is required" });
      }

      const result = await verifyWithdrawalOTP(
        req.params.id,
        context.userId,
        otp,
        context.organizationId
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  }
);

// RESEND OTP FOR WITHDRAWAL
router.post(
  "/withdrawals/:id/resend-otp",
  authMiddleware,
  organizationContextMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const context = getUserContext(req);
      if (!context) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const result = await resendWithdrawalOTP(
        req.params.id,
        context.userId,
        context.organizationId
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: String(error) });
    }
  }
);

export default router;
