import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./utils/passport.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================
const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "NODE_ENV",
  "FRONTEND_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
];

const missingVars = REQUIRED_ENV_VARS.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ DEPLOYMENT ERROR: Missing required environment variables");
  console.error("   The following environment variables are required but not set:");
  missingVars.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error("\n   Please set these variables in your .env file or hosting platform.");
  console.error("   Server cannot start without these variables.");
  process.exit(1);
}

console.log("✅ All required environment variables are present");

// Load package.json for version info
let packageJson: { version?: string } = {};
try {
  const packagePath = join(__dirname, "..", "package.json");
  packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
} catch (error) {
  console.warn("⚠️  Could not load package.json for version info");
}

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Trust proxy so HTTPS redirects are respected behind Render/other proxies
app.set("trust proxy", 1);

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
const allowedOrigins = IS_PRODUCTION
  ? [
      process.env.FRONTEND_URL,
      "https://contribly-web.onrender.com",
      "https://contribly.onrender.com",
      // Add additional production URLs from CORS_ORIGIN if needed
      ...(process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) || []),
    ].filter(Boolean)
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.FRONTEND_URL,
    ].filter(Boolean);

console.log(
  IS_PRODUCTION ? "🔒 Production CORS enabled" : "🔓 Development CORS enabled"
);
console.log("🌍 CORS allowed origins:", allowedOrigins);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl, server-to-server)
      if (!origin) {
        console.log("✅ CORS: Allowing request with no origin");
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ CORS: Allowing origin: ${origin}`);
        callback(null, true);
      } else {
        console.error(`❌ CORS: Rejecting origin: ${origin}`);
        console.error(`   Allowed origins:`, allowedOrigins);
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Contribly API v1.0.0",
    status: "running",
    docs: "/api",
  });
});

// ============================================================================
// HEALTH CHECK ENDPOINT (for Render auto-restart)
// ============================================================================
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: packageJson.version || "unknown",
  });
});

// Alternate health check path
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Contribly API is running",
    environment: process.env.NODE_ENV || "development",
    version: packageJson.version || "unknown",
    cors: {
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin || "none",
    },
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint to troubleshoot auth issues (development/staging only)
if (process.env.NODE_ENV !== "production") {
  app.get("/api/debug/auth", (req, res) => {
    res.json({
      cookies: req.cookies || {},
      headers: {
        authorization: req.headers.authorization || "none",
        origin: req.headers.origin || "none",
        referer: req.headers.referer || "none",
        "user-agent": req.headers["user-agent"] || "none",
      },
      hasTokenCookie: !!req.cookies?.token,
      hasAuthHeader: !!req.headers.authorization,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });
}

// Routes (lazy loaded)
app.get("/api", (req, res) => {
  res.json({
    message: "Contribly API v1.0.0",
    status: "running",
    version: packageJson.version || "unknown",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      organizations: "/api/organizations",
      payments: "/api/payments",
      claims: "/api/claims",
    },
  });
});

// Try to load routes if database is available (ESM-friendly dynamic import)
void (async () => {
  try {
    console.log("Loading routes...");
    const authRoutes = (await import("./routes/auth.routes.js")).default;
    console.log("✓ Auth routes loaded");

    const organizationRoutes = (await import("./routes/organization.routes.js")).default;
    console.log("✓ Organization routes loaded");

    const paymentRoutes = (await import("./routes/payment.routes.js")).default;
    console.log("✓ Payment routes loaded");

    const claimRoutes = (await import("./routes/claim.routes.js")).default;
    console.log("✓ Claim routes loaded");

    const inviteRoutes = (await import("./routes/invite.routes.js")).default;
    console.log("✓ Invite routes loaded");

    const onboardingRoutes = (await import("./routes/onboarding.routes.js")).default;
    console.log("✓ Onboarding routes loaded");

    const userRoutes = (await import("./routes/user.routes.js")).default;
    console.log("✓ User routes loaded");

    const auditRoutes = (await import("./routes/audit.routes.js")).default;
    console.log("✓ Audit routes loaded");

    const adminRoutes = (await import("./routes/admin.routes.js")).default;
    console.log("✓ Admin routes loaded");

    app.use("/api/auth", authRoutes);
    app.use("/api", organizationRoutes);
    app.use("/api", paymentRoutes);
    app.use("/api", claimRoutes);
    app.use("/api", inviteRoutes);
    app.use("/api/onboarding", onboardingRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api", auditRoutes);
    app.use("/api", adminRoutes);
    console.log("✓ All routes registered successfully");
  } catch (err) {
    console.error("❌ Failed to load routes:", err instanceof Error ? err.message : err);
    console.error("Full error:", err);
    // In production, this is a critical error
    if (IS_PRODUCTION) {
      console.error("❌ CRITICAL: Cannot start server without routes in production");
      process.exit(1);
    }
  }
})();

// Error handling
app.use(
  (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("❌ Express error handler:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
);

// ============================================================================
// GLOBAL ERROR HANDLERS (for uncaught errors)
// ============================================================================
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION detected:");
  console.error("   Promise:", promise);
  console.error("   Reason:", reason);
  if (reason instanceof Error) {
    console.error("   Stack:", reason.stack);
  }
  // In production, exit so Render can restart the service
  if (IS_PRODUCTION) {
    console.error("   Exiting in 1 second...");
    setTimeout(() => process.exit(1), 1000);
  }
});

process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION detected:");
  console.error("   Error:", error.message);
  console.error("   Stack:", error.stack);
  // Always exit on uncaught exceptions
  console.error("   Exiting in 1 second...");
  setTimeout(() => process.exit(1), 1000);
});

// ============================================================================
// START SERVER
// ============================================================================
app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`   Version: ${packageJson.version || "unknown"}`);
  console.log(`   CORS: ${allowedOrigins.length} origins allowed`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});
