import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./utils/passport.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy so HTTPS redirects are respected behind Render/other proxies
app.set("trust proxy", 1);

// CORS configuration - allows local dev and production frontends
const allowedOrigins = [
  "http://localhost:3000",                    // Local dev
  "http://localhost:3001",                    // Local API dev
  "https://contribly-web.onrender.com",       // Render production (PRIMARY)
  "https://contribly-web.vercel.app",         // Vercel production
  "https://contribly.onrender.com",           // Render frontend (alternative)
  process.env.FRONTEND_URL,                   // Any custom frontend URL from env
].filter(Boolean);

console.log("🌍 CORS allowed origins:", allowedOrigins);

// Middleware
app.use(cors({
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
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Contribly API v1.0.0",
    status: "running",
    docs: "/api"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Contribly API is running",
    environment: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: allowedOrigins,
      requestOrigin: req.headers.origin || "none",
    },
    timestamp: new Date().toISOString(),
  });
});

// Routes (lazy loaded)
app.get("/api", (req, res) => {
  res.json({ 
    message: "Contribly API v1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      organizations: "/api/organizations",
      payments: "/api/payments",
      claims: "/api/claims",
    }
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

    app.use("/api/auth", authRoutes);
    app.use("/api", organizationRoutes);
    app.use("/api", paymentRoutes);
    app.use("/api", claimRoutes);
    app.use("/api", inviteRoutes);
    console.log("✓ All routes registered successfully");
  } catch (err) {
    console.error("❌ Failed to load routes:", err instanceof Error ? err.message : err);
    console.error("Full error:", err);
  }
})();

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});
