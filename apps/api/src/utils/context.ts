import { AuthRequest, OrganizationRole, DepartmentRole } from "../middleware/auth.middleware";

export interface UserContext {
  userId: string;
  email: string;
  organizationId: string;
  organizationRole: OrganizationRole;
  departmentId?: string;
  departmentRole?: DepartmentRole;
}

export function getUserContext(req: AuthRequest): UserContext | null {
  if (!req.user || !req.organizationContext) {
    return null;
  }

  return {
    userId: req.user.userId,
    email: req.user.email,
    organizationId: req.organizationContext.organizationId,
    organizationRole: req.organizationContext.role,
    departmentId: req.departmentContext?.departmentId,
    departmentRole: req.departmentContext?.role,
  };
}

export function isChiefAdmin(context: UserContext | null): boolean {
  return context?.organizationRole === "CHIEF_ADMIN";
}

export function isDepartmentAdmin(context: UserContext | null): boolean {
  return context?.departmentRole === "ADMIN";
}

export function isDepartmentMember(context: UserContext | null): boolean {
  return context?.departmentRole === "ADMIN" || context?.departmentRole === "MEMBER";
}
