import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow both localhost and production URLs
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://contribly-web.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

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
  res.json({ status: "ok", message: "Contribly API is running" });
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
    const authRoutes = (await import("./routes/auth.routes.js")).default;
    const organizationRoutes = (await import("./routes/organization.routes.js")).default;
    const paymentRoutes = (await import("./routes/payment.routes.js")).default;
    const claimRoutes = (await import("./routes/claim.routes.js")).default;

    app.use(authRoutes);
    app.use(organizationRoutes);
    app.use(paymentRoutes);
    app.use(claimRoutes);
  } catch (err) {
    console.error("Failed to load routes (likely Prisma not initialized):", err);
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
