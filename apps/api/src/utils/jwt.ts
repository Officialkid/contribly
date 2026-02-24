import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
const JWT_EXPIRY = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log("✅ JWT verified:", { userId: decoded.userId, email: decoded.email, exp: new Date(decoded.exp * 1000).toISOString() });
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error("❌ JWT verification failed: Token expired at", error.expiredAt);
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error("❌ JWT verification failed:", error.message);
    } else {
      console.error("❌ JWT verification failed:", error);
    }
    return null;
  }
}
