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
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.replace("Bearer ", "");
    const token = cookieToken || headerToken;

    console.log("🔐 Auth middleware:", {
      method: req.method,
      path: req.path,
      origin: req.headers.origin || "none",
      hasCookie: !!cookieToken,
      cookieTokenPreview: cookieToken ? `${cookieToken.substring(0, 20)}...` : "none",
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader ? `${authHeader.substring(0, 30)}...` : "none",
      hasToken: !!token,
      cookieNames: Object.keys(req.cookies || {}),
      userAgent: req.headers["user-agent"]?.substring(0, 50),
    });

    if (!token) {
      console.error("❌ Auth failed: No token provided");
      console.error("   Cookies received:", req.cookies);
      console.error("   Authorization header:", authHeader || "none");
      res.status(401).json({ success: false, error: "No authentication token" });
      return;
    }

    const payload = verifyToken(token);
    if (!payload) {
      console.error("❌ Auth failed: Token verification failed");
      console.error("   Token source:", cookieToken ? "cookie" : "Authorization header");
      res.status(401).json({ success: false, error: "Invalid or expired token" });
      return;
    }

    console.log("✅ Auth success:", { userId: payload.userId, email: payload.email });
    req.user = payload;
    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    res.status(401).json({ success: false, error: "Authentication failed" });
  }
}
