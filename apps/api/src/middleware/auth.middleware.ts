import { Request, Response, NextFunction } from "express";
import { verifyToken, JWTPayload } from "../utils/jwt";

export type OrganizationRole = "CHIEF_ADMIN" | "MEMBER";
export type DepartmentRole = "ADMIN" | "MEMBER";

export interface OrganizationContext {
  organizationId: string;
  role: OrganizationRole;
  organization: {
    id: string;
    name: string;
  };
}

export interface DepartmentContext {
  departmentId: string;
  role: DepartmentRole;
  department: {
    id: string;
    name: string;
    organizationId: string;
  };
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
  organizationContext?: OrganizationContext;
  departmentContext?: DepartmentContext;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, error: "No authentication token" });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Authentication failed" });
  }
}
