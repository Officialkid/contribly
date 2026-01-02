import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import {
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireChiefAdmin,
  requireDepartmentMember,
} from "../middleware/context.middleware";
import {
  recordPayment,
  listPaymentsByOrganization,
  getPaymentById,
} from "../services/payment.service";
import {
  matchPayment,
  matchPaymentByReference,
  unmatchPayment,
} from "../services/matching.service";
import {
  getMemberBalanceInDepartment,
  getDepartmentContributionsSummary,
  listMemberBalancesInOrganization,
} from "../services/carryforward.service";

const router = Router();

// Record new payment (Chief Admin only)
router.post(
  "/organizations/:organizationId/payments",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const { amount, reference, accountNumber, transactionDate } = req.body;

    if (!amount || !transactionDate) {
      return res.status(400).json({ success: false, error: "amount and transactionDate are required" });
    }

    const result = await recordPayment(
      req.organizationContext!.organizationId,
      amount,
      reference || null,
      accountNumber || null,
      new Date(transactionDate)
    );

    return res.status(201).json(result);
  }
);

// List payments by organization
router.get(
  "/organizations/:organizationId/payments",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const { status } = req.query;
    const result = await listPaymentsByOrganization(
      req.organizationContext!.organizationId,
      (status as any) || undefined
    );
    return res.json(result);
  }
);

// Get payment details
router.get(
  "/organizations/:organizationId/payments/:paymentId",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const result = await getPaymentById(req.params.paymentId, req.organizationContext!.organizationId);
    if (!result.success) return res.status(404).json(result);
    return res.json(result);
  }
);

// Match payment to user/department
router.post(
  "/organizations/:organizationId/payments/:paymentId/match",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const { userId, departmentId } = req.body;

    if (!userId || !departmentId) {
      return res.status(400).json({ success: false, error: "userId and departmentId are required" });
    }

    const result = await matchPayment(
      req.params.paymentId,
      req.organizationContext!.organizationId,
      departmentId,
      userId
    );

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  }
);

// Match payment by reference code
router.post(
  "/organizations/:organizationId/payments/:paymentId/match-by-reference",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const { departmentId, paymentReference } = req.body;

    if (!departmentId || !paymentReference) {
      return res.status(400).json({ success: false, error: "departmentId and paymentReference are required" });
    }

    const result = await matchPaymentByReference(
      req.params.paymentId,
      req.organizationContext!.organizationId,
      departmentId,
      paymentReference
    );

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  }
);

// Unmatch payment
router.post(
  "/organizations/:organizationId/payments/:paymentId/unmatch",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const result = await unmatchPayment(req.params.paymentId, req.organizationContext!.organizationId);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  }
);

// Get member balance in department
router.get(
  "/organizations/:organizationId/departments/:departmentId/balance",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentMember,
  async (req: AuthRequest, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId query param is required" });
    }

    const result = await getMemberBalanceInDepartment(
      req.departmentContext!.departmentId,
      userId
    );

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  }
);

// Get department contributions summary (by year)
router.get(
  "/organizations/:organizationId/departments/:departmentId/contributions",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const result = await getDepartmentContributionsSummary(
      req.departmentContext!.departmentId,
      year
    );

    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  }
);

// Get organization-wide contributions (all departments by year)
router.get(
  "/organizations/:organizationId/contributions",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const result = await listMemberBalancesInOrganization(
      req.organizationContext!.organizationId,
      year
    );

    return res.json(result);
  }
);

export default router;
