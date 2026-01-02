import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import {
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireChiefAdmin,
  requireDepartmentAdmin,
} from "../middleware/context.middleware";
import {
  createOrganization,
  listOrganizationsForUser,
  getOrganizationForUser,
} from "../services/organization.service";
import {
  createDepartment,
  updateDepartment,
  listDepartments,
  assignDepartmentAdmin,
  removeDepartmentAdmin,
} from "../services/department.service";
import { createInviteLink } from "../services/invite.service";

const router = Router();

// Create organization (caller becomes CHIEF_ADMIN)
router.post("/organizations", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, error: "Name is required" });
  }

  const result = await createOrganization(req.user!.userId, name);
  return res.status(201).json(result);
});

// List organizations for current user
router.get("/organizations", authMiddleware, async (req: AuthRequest, res: Response) => {
  const result = await listOrganizationsForUser(req.user!.userId);
  return res.json(result);
});

// Get organization details (scoped)
router.get(
  "/organizations/:organizationId",
  authMiddleware,
  organizationContextMiddleware,
  async (req: AuthRequest, res: Response) => {
    const result = await getOrganizationForUser(req.organizationContext!.organizationId, req.user!.userId);
    if (!result.success) return res.status(404).json(result);
    return res.json(result);
  }
);

// Create department (Chief Admin only)
router.post(
  "/organizations/:organizationId/departments",
  authMiddleware,
  organizationContextMiddleware,
  requireChiefAdmin,
  async (req: AuthRequest, res: Response) => {
    const { name, monthlyContribution } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "Name is required" });
    }

    const result = await createDepartment(
      req.organizationContext!.organizationId,
      name,
      monthlyContribution ?? null,
      req.user!.userId
    );

    return res.status(201).json(result);
  }
);

// Update department (Department Admin)
router.patch(
  "/organizations/:organizationId/departments/:departmentId",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentAdmin,
  async (req: AuthRequest, res: Response) => {
    const { name, monthlyContribution } = req.body;
    const result = await updateDepartment(
      req.departmentContext!.departmentId,
      req.organizationContext!.organizationId,
      name,
      monthlyContribution ?? null
    );

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  }
);

// List departments in organization
router.get(
  "/organizations/:organizationId/departments",
  authMiddleware,
  organizationContextMiddleware,
  async (req: AuthRequest, res: Response) => {
    const result = await listDepartments(req.organizationContext!.organizationId);
    return res.json(result);
  }
);

// Assign Department Admin
router.post(
  "/organizations/:organizationId/departments/:departmentId/admins",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentAdmin,
  async (req: AuthRequest, res: Response) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    const result = await assignDepartmentAdmin(
      req.organizationContext!.organizationId,
      req.departmentContext!.departmentId,
      userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  }
);

// Remove Department Admin
router.delete(
  "/organizations/:organizationId/departments/:departmentId/admins/:userId",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentAdmin,
  async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;

    const result = await removeDepartmentAdmin(
      req.organizationContext!.organizationId,
      req.departmentContext!.departmentId,
      userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
  }
);

// Generate department invite link (Department Admin or Chief Admin)
router.post(
  "/organizations/:organizationId/departments/:departmentId/invites",
  authMiddleware,
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireDepartmentAdmin,
  async (req: AuthRequest, res: Response) => {
    const { expiresAt, maxUses } = req.body;
    const expiresDate = expiresAt ? new Date(expiresAt) : null;

    const result = await createInviteLink(
      req.departmentContext!.departmentId,
      req.user!.userId,
      expiresDate,
      maxUses ?? null
    );

    return res.status(201).json(result);
  }
);

export default router;
