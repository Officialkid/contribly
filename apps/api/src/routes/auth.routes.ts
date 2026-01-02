import { Router, Response } from "express";
import { registerUser, loginUser, googleOAuthUser } from "../services/auth.service.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import passport from "../utils/passport.js";

const router = Router();

// REGISTER
router.post("/register", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, organizationName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password required" });
    }

    const result = await registerUser(email, password, organizationName);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Set HTTP-only cookie
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// LOGIN
router.post("/login", async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password required" });
    }

    const result = await loginUser(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Set HTTP-only cookie
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Login failed" });
  }
});

// GOOGLE OAuth - Initiate authentication
router.get(
  "/google",
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    session: false,
  })
);

// GOOGLE OAuth - Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}?error=google_auth_failed`,
  }),
  (req: AuthRequest, res: Response) => {
    try {
      console.log("🔵 Google OAuth callback handler triggered");
      
      // Passport attaches user data to req.user
      const userData = req.user as any;
      
      console.log("🔵 User data from passport:", {
        hasUser: !!userData,
        hasToken: !!userData?.token,
        userId: userData?.user?.id,
        organizationId: userData?.organizationId
      });

      if (!userData || !userData.token) {
        console.error("❌ No user data or token from passport");
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}?error=auth_failed`);
      }

      console.log("🔵 Setting cookie for user:", userData.user?.id);

      // Set HTTP-only cookie
      res.cookie("token", userData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend callback page with success
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirectUrl = new URL("/auth/callback", frontendUrl);
      
      if (userData.organizationId) {
        redirectUrl.searchParams.set("organizationId", userData.organizationId);
      }
      
      console.log("✅ Redirecting to:", redirectUrl.toString());
      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("❌ Google OAuth callback error:", error);
      console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
      console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}?error=callback_failed`);
    }
  }
);

// GET CURRENT USER
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        organizationMembers: {
          select: {
            organizationId: true,
            role: true,
          },
          take: 1,
        },
      },
    });

    await prisma.$disconnect();

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId: user.organizationMembers[0]?.organizationId,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

// LOGOUT
router.post("/logout", (req: AuthRequest, res: Response) => {
  res.clearCookie("token");
  return res.json({ success: true });
});

export default router;
