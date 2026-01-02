import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import { z } from "zod";
import {
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireChiefAdmin,
  requireDepartmentMember,
} from "../middleware/context.middleware.js";
import {
  submitPaymentClaim,
  listClaimsByDepartment,
  approveClaim,
  rejectClaim,
} from "../services/claim.service.js";

const router = Router();

// Submit payment claim (any department member)
const createClaimSchema = z.object({
  paymentId: z.string().min(1, "paymentId is required"),
  transactionCode: z.string().min(1, "transactionCode is required"),
  details: z.string().optional(),
});

router.post(
  "/organizations/:organizationId/departments/:departmentId/claims",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentMember,
  async (req: AuthRequest, res: Response) => {
    const parsed = createClaimSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Invalid payload" });
    }

    const { paymentId, transactionCode, details } = parsed.data;

    const result = await submitPaymentClaim(
      paymentId,
      req.user!.userId,
      req.departmentContext!.departmentId,
      req.organizationContext!.organizationId,
      transactionCode,
      details || undefined
    );

    if (!result.success) return res.status(400).json(result);
    return res.status(201).json(result);
  }
);

// List claims in department
router.get(
  "/organizations/:organizationId/departments/:departmentId/claims",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const { status } = req.query;

    const result = await listClaimsByDepartment(
      req.departmentContext!.departmentId,
      (status as any) || undefined
    );

    return res.json(result);
  }
);

// Approve claim (Chief Admin only)
router.post(
  "/organizations/:organizationId/claims/:claimId/approve",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const result = await approveClaim(
      req.params.claimId,
      req.organizationContext!.organizationId,
      req.user!.userId
    );

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  }
);

// Reject claim (Chief Admin only)
router.post(
  "/organizations/:organizationId/claims/:claimId/reject",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const { reason } = req.body;

    const result = await rejectClaim(
      req.params.claimId,
      req.organizationContext!.organizationId,
      req.user!.userId,
      reason || undefined
    );

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  }
);

export default router;
