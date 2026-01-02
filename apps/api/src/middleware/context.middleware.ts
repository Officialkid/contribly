import { NextFunction, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, OrganizationContext, DepartmentContext } from "./auth.middleware.js";

const prisma = new PrismaClient();

function extractOrganizationId(req: AuthRequest): string | undefined {
  // Trust only route params (or common aliases) to scope organization; headers are not trusted.
  return (req.params as any)?.organizationId || (req.params as any)?.orgId;
}

function extractDepartmentId(req: AuthRequest): string | undefined {
  // Trust only route params (or common aliases) to scope department; headers are not trusted.
  return (req.params as any)?.departmentId || (req.params as any)?.deptId;
}

export async function organizationContextMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const organizationId = extractOrganizationId(req);
  if (!organizationId) {
    return res.status(400).json({ success: false, error: "Organization ID is required" });
  }

  try {
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: req.user.userId,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: "Access denied for this organization" });
    }

    const context: OrganizationContext = {
      organizationId: membership.organizationId,
      role: membership.role,
      organization: membership.organization,
    };

    req.organizationContext = context;
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to resolve organization context" });
  }
}

export async function departmentContextMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  if (!req.organizationContext) {
    return res.status(400).json({ success: false, error: "Organization context is required before department context" });
  }

  const departmentId = extractDepartmentId(req);
  if (!departmentId) {
    return res.status(400).json({ success: false, error: "Department ID is required" });
  }

  try {
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        organizationId: req.organizationContext.organizationId,
      },
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    });

    if (!department) {
      return res.status(403).json({ success: false, error: "Department not found in this organization" });
    }

    const membership = await prisma.departmentMember.findFirst({
      where: {
        departmentId,
        userId: req.user.userId,
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: "Access denied for this department" });
    }

    const context: DepartmentContext = {
      departmentId,
      role: membership.role,
      department,
    };

    req.departmentContext = context;
    return next();
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to resolve department context" });
  }
}

export function requireChiefAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.organizationContext?.role !== "CHIEF_ADMIN") {
    return res.status(403).json({ success: false, error: "Chief Admin role required" });
  }
  return next();
}

export function requireDepartmentAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.departmentContext) {
    return res.status(400).json({ success: false, error: "Department context required" });
  }
  if (req.departmentContext.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "Department Admin role required" });
  }
  return next();
}

export function requireDepartmentMember(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.departmentContext) {
    return res.status(400).json({ success: false, error: "Department context required" });
  }
  return next();
}
