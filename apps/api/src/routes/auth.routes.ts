import { PrismaClient } from "@prisma/client";
import { Response, Router } from "express";
import passport, { isGoogleOAuthConfigured } from "../utils/passport.js";
import { ZodError } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware.js";
import {
  forgotPasswordLimiter,
  loginLimiter,
  mfaLimiter,
  otpRequestLimiter,
  registrationLimiter,
  resetPasswordLimiter,
} from "../middleware/rate-limit.middleware.js";
import {
  confirmEnableMFA,
  disableMFA,
  enableMFARequest,
  forgotPassword,
  generateMFACode,
  loginUser,
  registerUser,
  resetPassword,
  verifyMFACode,
  verifyMFALogin,
} from "../services/auth.service.js";
import { sendMFACodeEmail, sendPasswordResetEmail } from "../services/email.service.js";
import {
  forgotPasswordSchema,
  loginSchema,
  mfaCodeSchema,
  mfaLoginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validators.js";

const router = Router();
const prisma = new PrismaClient();

function googleOAuthUnavailable(res: Response) {
  return res.status(503).json({
    success: false,
    error: "Google sign-in is not configured for this environment.",
  });
}

router.post("/register", registrationLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    const { email, password, name, organizationName } = validated;

    const result = await registerUser(email, password, name, organizationName);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const redirectUrl = new URL(
      `/orgs/${result.user?.organizationId}`,
      process.env.FRONTEND_URL || "http://localhost:3000"
    );

    return res.json({
      success: true,
      user: result.user,
      redirectUrl: redirectUrl.toString(),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }

    console.error("Registration error:", error);
    return res.status(500).json({ success: false, error: "Registration failed" });
  }
});

router.post("/login", loginLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const validated = loginSchema.parse(req.body);
    const { email, password } = validated;

    const result = await loginUser(email, password);
    if (!result.success) {
      return res.status(401).json(result);
    }

    if (result.requiresMfa) {
      return res.json({
        success: true,
        requiresMfa: true,
        email: result.email,
      });
    }

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
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

router.post("/login/verify-mfa", mfaLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const validated = mfaLoginSchema.parse(req.body);
    const { email, code } = validated;

    const result = await verifyMFALogin(email, code);
    if (!result.success) {
      return res.status(401).json(result);
    }

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
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

router.get(
  "/google",
  (_req, res, next) => {
    if (!isGoogleOAuthConfigured) {
      return googleOAuthUnavailable(res);
    }
    next();
  },
  passport.authenticate("google", {
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    session: false,
  })
);

router.get(
  "/google/callback",
  (_req, res, next) => {
    if (!isGoogleOAuthConfigured) {
      return googleOAuthUnavailable(res);
    }
    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/login?error=google_auth_failed`,
  }),
  (req: AuthRequest, res: Response) => {
    try {
      const userData = req.user as any;

      if (!userData?.token || !userData?.organizationId) {
        console.error("Google OAuth callback missing user token or organizationId");
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=auth_failed`
        );
      }

      res.cookie("token", userData.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const redirectUrl = new URL("/auth/callback", frontendUrl);
      redirectUrl.searchParams.set("organizationId", userData.organizationId);

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/login?error=callback_failed`);
    }
  }
);

router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

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

router.post("/logout", (_req: AuthRequest, res: Response) => {
  res.clearCookie("token");
  return res.json({ success: true });
});

router.post("/forgot-password", forgotPasswordLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const validated = forgotPasswordSchema.parse(req.body);
    const { email } = validated;

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

    if (user && result.rawToken) {
      await sendPasswordResetEmail(email, result.rawToken, user.name || undefined);
    }

    return res.json({
      success: true,
      message: "If an account exists with this email, password reset instructions have been sent.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }

    console.error("Forgot password route error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to process password reset request",
    });
  }
});

router.post("/reset-password", resetPasswordLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const validated = resetPasswordSchema.parse(req.body);
    const { token, newPassword } = validated;

    const result = await resetPassword(token, newPassword);
    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json({
      success: true,
      message: "Your password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }

    console.error("Reset password route error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to reset password. Please try again.",
    });
  }
});

router.post("/request-mfa", authMiddleware, otpRequestLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const result = await generateMFACode(userId);
    if (!result.success || !result.code) {
      return res
        .status(500)
        .json({ success: false, error: result.error || "Failed to generate code" });
    }

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

router.post("/verify-mfa", authMiddleware, mfaLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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

router.post("/mfa/enable", authMiddleware, otpRequestLimiter, async (req: AuthRequest, res: Response) => {
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
      message: "Verification code sent to your email. Please verify to enable MFA.",
    });
  } catch (error) {
    console.error("Enable MFA request error:", error);
    return res.status(500).json({ success: false, error: "Failed to process request" });
  }
});

router.post("/mfa/confirm", authMiddleware, mfaLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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
      message: "MFA enabled successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }

    console.error("Confirm enable MFA error:", error);
    return res.status(500).json({ success: false, error: "Failed to enable MFA" });
  }
});

router.post("/mfa/disable", authMiddleware, mfaLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
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
      message: "MFA disabled successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }

    console.error("Disable MFA error:", error);
    return res.status(500).json({ success: false, error: "Failed to disable MFA" });
  }
});

router.get("/mfa/status", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.json({
      success: true,
      mfaEnabled: user.mfaEnabled,
    });
  } catch (error) {
    console.error("Get MFA status error:", error);
    return res.status(500).json({ success: false, error: "Failed to get MFA status" });
  }
});

export default router;
