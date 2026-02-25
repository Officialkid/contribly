import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
const JWT_EXPIRY = "7d";
const JWT_ALGORITHM = "HS256";

// Validate JWT secret length on module load (minimum 32 characters for security)
if (JWT_SECRET.length < 32) {
  console.error("❌ SECURITY ERROR: JWT_SECRET must be at least 32 characters long");
  console.error("   Current length:", JWT_SECRET.length);
  console.error("   Please set a strong JWT_SECRET in your environment variables.");
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  } else {
    console.warn("⚠️  Continuing in development mode with weak JWT secret. DO NOT USE IN PRODUCTION.");
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { 
    expiresIn: JWT_EXPIRY,
    algorithm: JWT_ALGORITHM as jwt.Algorithm,
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { 
      algorithms: [JWT_ALGORITHM as jwt.Algorithm],
    }) as JWTPayload;
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
