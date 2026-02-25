import { Router, Response } from "express";
import { registerUser, loginUser, googleOAuthUser, forgotPassword, resetPassword, generateMFACode, verifyMFACode, verifyMFALogin, enableMFARequest, confirmEnableMFA, disableMFA } from "../services/auth.service.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import { loginLimiter, forgotPasswordLimiter, registrationLimiter, mfaLimiter, resetPasswordLimiter } from "../middleware/rate-limit.middleware.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, mfaCodeSchema, mfaLoginSchema } from "../validators/auth.validators.js";
import { sendPasswordResetEmail, sendMFACodeEmail } from "../services/email.service.js";
import { PrismaClient } from "@prisma/client";
import passport from "../utils/passport.js";
import { ZodError } from "zod";

const router = Router();
const prisma = new PrismaClient();

// REGISTER
router.post("/register", registrationLimiter, async (req: AuthRequest, res: Response) => {
  try {
    // Validate input with Zod
    const validated = registerSchema.parse(req.body);
    const { email, password, name, organizationName } = validated;

    const result = await registerUser(email, password, name, organizationName);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Set HTTP-only cookie
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to organization dashboard if organizationId available
    const redirectUrl = new URL(
      `/orgs/${result.user?.organizationId}`,
      process.env.FRONTEND_URL || "http://localhost:3000"
    );

    return res.json({
      success: true,
      user: result.user,
      redirectUrl: redirectUrl.toString(),
      // DO NOT include token in response body - it's in HTTP-only cookie
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error("❌ Registration error:", error);
    return res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// LOGIN
router.post("/login", loginLimiter, async (req: AuthRequest, res: Response) => {
  try {
    // Validate input with Zod
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    const result = await loginUser(email, password);

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Check if MFA is required
    if (result.requiresMfa) {
      return res.json({
        success: true,
        requiresMfa: true,
        email: result.email,
      });
    }

    // Set HTTP-only cookie for normal login
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    
    res.cookie("token", result.token, cookieOptions);
    
    console.log("🍪 Cookie set on login:", {
      hasToken: !!result.token,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      httpOnly: cookieOptions.httpOnly,
      origin: req.headers.origin,
      userEmail: result.user?.email,
    });

    return res.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    return res.status(500).json({ success: false, error: "Login failed" });
  }
});

// VERIFY MFA CODE DURING LOGIN
router.post("/login/verify-mfa", mfaLimiter, async (req: AuthRequest, res: Response) => {
  try {
    // Validate input with Zod
    const validated = mfaLoginSchema.parse(req.body);
    const { email, code } = validated;

    const result = await verifyMFALogin(email, code);

    if (!result.success) {
      return res.status(401).json(result);
    }

    // Set HTTP-only cookie after successful MFA verification
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    
    res.cookie("token", result.token, cookieOptions);
    
    console.log("🍪 Cookie set on MFA verification:", {
      hasToken: !!result.token,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      httpOnly: cookieOptions.httpOnly,
      origin: req.headers.origin,
      userEmail: result.user?.email,
    });

    return res.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error("MFA verification error:", error);
    return res.status(500).json({ success: false, error: "MFA verification failed" });
  }
});

// GOOGLE OAuth - Initiate authentication
router.get(
  "/google",
  passport.authenticate("google", { 
    scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
    session: false,
  })
);

// GOOGLE OAuth - Callback
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=google_auth_failed`,
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

      if (!userData || !userData.token || !userData.organizationId) {
        console.error("❌ Missing user data, token, or organizationId from passport");
        return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=auth_failed`);
      }

      console.log("🔵 Setting cookie for user:", userData.user?.id);

      // Set HTTP-only cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      };
      
      res.cookie("token", userData.token, cookieOptions);
      
      console.log("🍪 Cookie set on OAuth:", {
        hasToken: !!userData.token,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        httpOnly: cookieOptions.httpOnly,
        origin: req.headers.origin,
        userEmail: userData.user?.email,
      });

      // Redirect to auth callback with organizationId parameter
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirectUrl = new URL(`/auth/callback`, frontendUrl);
      redirectUrl.searchParams.set("organizationId", userData.organizationId);
      
      console.log("✅ Redirecting to:", redirectUrl.toString());
      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("❌ Google OAuth callback error:", error);
      console.error("❌ Error details:", error instanceof Error ? error.message : String(error));
      console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/login?error=callback_failed`);
    }
  }
);

// GET CURRENT USER
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    console.log("📍 /me endpoint reached - user authenticated:", { 
      userId: req.user?.userId, 
      email: req.user?.email,
      origin: req.headers.origin 
    });
    
    const userId = req.user?.userId;
    if (!userId) {
      console.error("❌ /me: No userId in authenticated request");
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

    const organizationId = user?.organizationMembers?.[0]?.organizationId || null;
    const organizationRole = user?.organizationMembers?.[0]?.role || null;

    let departmentId: string | null = null;
    let departmentRole: "ADMIN" | "MEMBER" | null = null;

    if (organizationId) {
      const deptMembership = await prisma.departmentMember.findFirst({
        where: {
          userId,
          Department: {
            organizationId,
          },
        },
        select: {
          departmentId: true,
          role: true,
        },
      });

      departmentId = deptMembership?.departmentId || null;
      departmentRole = deptMembership?.role || null;
    }

    await prisma.$disconnect();

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const role: "CHIEF_ADMIN" | "ADMIN" | "MEMBER" | null =
      organizationRole === "CHIEF_ADMIN"
        ? "CHIEF_ADMIN"
        : departmentRole === "ADMIN"
          ? "ADMIN"
          : organizationId
            ? "MEMBER"
            : null;

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        organizationId,
        role: role || undefined,
        departmentId: departmentId || undefined,
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

// FORGOT PASSWORD
router.post("/forgot-password", forgotPasswordLimiter, async (req: AuthRequest, res: Response) => {
  try {
    // Validate input with Zod
    const validated = forgotPasswordSchema.parse(req.body);
    const { email } = validated;

    // Get user to find organizationId for audit log
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        organizationMembers: {
          select: { organizationId: true },
          take: 1,
        },
      },
    });

    const organizationId = user?.organizationMembers[0]?.organizationId;
    const result = await forgotPassword(email, organizationId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Send password reset email with raw token (not hashed)
    if (user && result.rawToken) {
      await sendPasswordResetEmail(email, result.rawToken, user.name || undefined);
    }

    // Always return success message (don't reveal if email exists)
    return res.json({ success: true, message: "If an account exists with this email, password reset instructions have been sent." });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error("Forgot password route error:", error);
    return res.status(500).json({ success: false, error: "Failed to process password reset request" });
  }
});

// RESET PASSWORD
router.post("/reset-password", resetPasswordLimiter, async (req: AuthRequest, res: Response) => {
  try {
    // Validate input with Zod
    const validated = resetPasswordSchema.parse(req.body);
    const { token, newPassword } = validated;

    const result = await resetPassword(token, newPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({ success: true, message: "Your password has been reset successfully. You can now log in with your new password." });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error("Reset password route error:", error);
    return res.status(500).json({ success: false, error: "Failed to reset password. Please try again." });
  }
});

// REQUEST MFA CODE
router.post("/request-mfa", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const result = await generateMFACode(userId);

    if (!result.success || !result.code) {
      return res.status(500).json({ success: false, error: result.error || "Failed to generate code" });
    }

    // Send MFA code email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await sendMFACodeEmail(user.email, result.code, user.name || undefined);
    }

    return res.json({ success: true, message: "Verification code sent to your email" });
  } catch (error) {
    console.error("Request MFA code error:", error);
    return res.status(500).json({ success: false, error: "Failed to send verification code" });
  }
});

// VERIFY MFA CODE
router.post("/verify-mfa", authMiddleware, mfaLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // Validate input with Zod
    const validated = mfaCodeSchema.parse(req.body);
    const { code } = validated;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const result = await verifyMFACode(userId, code);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({ success: true, message: "Verification successful" });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error("Verify MFA code error:", error);
    return res.status(500).json({ success: false, error: "Failed to verify code" });
  }
});

// MFA SETTINGS - Enable MFA (Request OTP)
router.post("/mfa/enable", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const result = await enableMFARequest(userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({ 
      success: true, 
      message: "Verification code sent to your email. Please verify to enable MFA." 
    });
  } catch (error) {
    console.error("Enable MFA request error:", error);
    return res.status(500).json({ success: false, error: "Failed to process request" });
  }
});

// MFA SETTINGS - Confirm and Enable MFA (Verify OTP)
router.post("/mfa/confirm", authMiddleware, mfaLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // Validate input with Zod
    const validated = mfaCodeSchema.parse(req.body);
    const { code } = validated;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const result = await confirmEnableMFA(userId, code);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({ 
      success: true, 
      message: "MFA enabled successfully" 
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error("Confirm enable MFA error:", error);
    return res.status(500).json({ success: false, error: "Failed to enable MFA" });
  }
});

// MFA SETTINGS - Disable MFA
router.post("/mfa/disable", authMiddleware, mfaLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    // Validate input with Zod
    const validated = mfaCodeSchema.parse(req.body);
    const { code } = validated;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const result = await disableMFA(userId, code);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({ 
      success: true, 
      message: "MFA disabled successfully" 
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error("Disable MFA error:", error);
    return res.status(500).json({ success: false, error: "Failed to disable MFA" });
  }
});

// MFA SETTINGS - Get MFA Status
router.get("/mfa/status", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { mfaEnabled: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({ 
      success: true, 
      mfaEnabled: user.mfaEnabled 
    });
  } catch (error) {
    console.error("Get MFA status error:", error);
    return res.status(500).json({ success: false, error: "Failed to get MFA status" });
  }
});

export default router;
