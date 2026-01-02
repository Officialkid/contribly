import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import { z } from "zod";
import {
  organizationContextMiddleware,
  departmentContextMiddleware,
  requireChiefAdmin,
  requireDepartmentAdmin,
} from "../middleware/context.middleware.js";
import {
  createOrganization,
  listOrganizationsForUser,
  getOrganizationForUser,
} from "../services/organization.service.js";
import {
  createDepartment,
  updateDepartment,
  listDepartments,
  assignDepartmentAdmin,
  removeDepartmentAdmin,
} from "../services/department.service.js";
import { createInviteLink } from "../services/invite.service.js";

const router = Router();

// Create organization (caller becomes CHIEF_ADMIN)
const createOrgSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

router.post("/organizations", authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = createOrgSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Invalid payload" });
  }

  const result = await createOrganization(req.user!.userId, parsed.data.name);
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
    const inviteSchema = z.object({
      expiresAt: z.string().datetime().optional(),
      maxUses: z.number().int().positive().optional(),
    });

    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.errors[0]?.message || "Invalid payload" });
    }

    const expiresDate = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;

    const result = await createInviteLink(
      req.departmentContext!.departmentId,
      req.user!.userId,
      expiresDate,
      parsed.data.maxUses ?? null
    );

    return res.status(201).json(result);
  }
);

export default router;
