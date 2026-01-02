import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken, JWTPayload } from "../utils/jwt.js";

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

// Type helper for route handlers that use AuthRequest
export type AuthHandler = RequestHandler<any, any, any, any, AuthRequest>;

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ success: false, error: "No authentication token" });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: "Invalid or expired token" });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: "Authentication failed" });
  }
}
