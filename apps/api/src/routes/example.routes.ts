import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import {
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireChiefAdmin,
  requireDepartmentAdmin,
  requireDepartmentMember,
} from "../middleware/context.middleware";

const router = Router();

// Organization-scoped example: requires membership, returns role
router.get(
  "/organizations/:organizationId/context",
  authMiddleware,
  organizationContextMiddleware,
  (req: AuthRequest, res: Response) => {
    return res.json({
      success: true,
      organization: req.organizationContext,
      user: { id: req.user?.userId, email: req.user?.email },
    });
  }
);

// Chief Admin only example
router.post(
  "/organizations/:organizationId/admin-action",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  (req: AuthRequest, res: Response) => {
    return res.json({ success: true, message: "Chief Admin action allowed" });
  }
);

// Department-scoped example: member access
router.get(
  "/organizations/:organizationId/departments/:departmentId/context",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentMember,
  (req: AuthRequest, res: Response) => {
    return res.json({
      success: true,
      organization: req.organizationContext,
      department: req.departmentContext,
      user: { id: req.user?.userId, email: req.user?.email },
    });
  }
);

// Department admin-only example
router.post(
  "/organizations/:organizationId/departments/:departmentId/close",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentAdmin,
  (req: AuthRequest, res: Response) => {
    return res.json({ success: true, message: "Department admin action allowed" });
  }
);

export default router;
