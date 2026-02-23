import bcrypt from "bcrypt";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../utils/jwt.js";
import { validatePassword } from "../utils/password-validation.js";
import { sendMFACodeEmail } from "./email.service.js";

const prisma = new PrismaClient();

export interface AuthPayload {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    organizationId?: string;
  };
  requiresMfa?: boolean;
  email?: string;
  error?: string;
}

export interface GoogleOAuthPayload {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

// REGISTER - Email + Password
export async function registerUser(
  email: string,
  password: string,
  name: string,
  organizationName: string
): Promise<AuthPayload> {
  try {
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.errors[0] };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.passwordHash) {
      return { success: false, error: "Email already registered with password" };
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          authProvider: "email",
        },
      });

      // Always create organization for new user
      const organization = await tx.organization.create({
        data: {
          id: crypto.randomUUID(),
          name: organizationName,
          updatedAt: new Date(),
          members: {
            create: {
              userId: user.id,
              role: "CHIEF_ADMIN",
            },
          },
        },
      });

      return { user, organizationId: organization.id };
    });

    const token = generateToken(result.user.id, result.user.email);

    return {
      success: true,
      token,
      user: { 
        id: result.user.id, 
        email: result.user.email, 
        name: result.user.name,
        organizationId: result.organizationId,
      },
    };
  } catch (error) {
    console.error("❌ Register error:", error);
    return { success: false, error: String(error) };
  }
}

// LOGIN - Email + Password
export async function loginUser(email: string, password: string): Promise<AuthPayload> {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        organizationMembers: {
          select: {
            organizationId: true,
            role: true,
          },
          take: 1,
        },
      },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: "Invalid email or password" };
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return { success: false, error: "Invalid email or password" };
    }

    // Check if MFA is enabled for this user
    if (user.mfaEnabled) {
      // Generate MFA code
      const mfaResult = await generateMFACode(user.id);
      
      if (!mfaResult.success || !mfaResult.code) {
        return { success: false, error: "Failed to generate verification code. Please try again." };
      }

      // Send MFA code via email
      try {
        await sendMFACodeEmail(user.email, mfaResult.code, user.name || undefined);
      } catch (emailError) {
        console.error("Failed to send MFA email:", emailError);
        // Clear the MFA code since we couldn't send it
        await prisma.user.update({
          where: { id: user.id },
          data: { mfaCode: null, mfaCodeExpiry: null },
        });
        return { success: false, error: "Failed to send verification code. Please try again." };
      }

      return {
        success: true,
        requiresMfa: true,
        email: user.email,
      };
    }

    // If MFA not enabled, proceed with normal login
    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        organizationId: user.organizationMembers[0]?.organizationId,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// GOOGLE OAuth - Login or Register
export async function googleOAuthUser(payload: GoogleOAuthPayload): Promise<AuthPayload> {
  try {
    let user = await prisma.user.findUnique({ where: { email: payload.email } });

    if (user) {
      // Link Google to existing account if not already linked
      if (user.authProvider !== "google") {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authProvider: "google",
            providerUserId: payload.id,
            name: user.name || payload.name,
          },
        });
      }
    } else {
      // Create new user with Google OAuth
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          authProvider: "google",
          providerUserId: payload.id,
          passwordHash: null,
        },
      });
    }

    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// GET USER BY ID
export async function getUserById(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        organizationMembers: {
          select: {
            organizationId: true,
            role: true,
            organization: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  } catch {
    return null;
  }
}

// FORGOT PASSWORD - Generate reset token
export async function forgotPassword(
  email: string,
  organizationId?: string
): Promise<{ success: boolean; rawToken?: string; error?: string }> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.passwordHash) {
      // Don't reveal if user exists for security
      return { success: true };
    }

    // Generate secure random reset token
    const crypto = await import("crypto");
    const rawToken = crypto.randomBytes(32).toString("hex");
    
    // Hash the token before storing in database (security best practice)
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry,
      },
    });

    // Audit log (if organizationId available)
    if (organizationId) {
      const { createAuditLog } = await import("./audit.service.js");
      await createAuditLog({
        organizationId,
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        resourceType: "User",
        resourceId: user.id,
        details: { email },
      });
    }

    return { success: true, rawToken }; // Return raw token to send in email
  } catch (error) {
    console.error("Forgot password error:", error);
    return { success: false, error: "Failed to process password reset request" };
  }
}

// RESET PASSWORD - Validate token and update password
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.errors[0] };
    }

    // Hash the incoming token to match stored hash
    const crypto = await import("crypto");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findUnique({ 
      where: { resetToken: hashedToken },
      include: {
        organizationMembers: {
          select: { organizationId: true },
          take: 1,
        },
      },
    });

    if (!user || !user.resetTokenExpiry) {
      return { success: false, error: "Invalid or expired reset token" };
    }

    if (user.resetTokenExpiry < new Date()) {
      return { success: false, error: "Reset token has expired. Please request a new password reset." };
    }

    // Hash new password with bcrypt (10 rounds as specified)
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Audit log
    const organizationId = user.organizationMembers[0]?.organizationId;
    if (organizationId) {
      const { createAuditLog } = await import("./audit.service.js");
      await createAuditLog({
        organizationId,
        userId: user.id,
        action: "PASSWORD_RESET_COMPLETED",
        resourceType: "User",
        resourceId: user.id,
        details: { email: user.email },
      });
    }

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, error: "Failed to reset password" };
  }
}

// GENERATE MFA CODE
export async function generateMFACode(userId: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const mfaCodeExpiry = new Date(Date.now() + 600000); // 10 minutes from now

    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaCode: code,
        mfaCodeExpiry,
      },
    });

    return { success: true, code };
  } catch (error) {
    console.error("Generate MFA code error:", error);
    return { success: false, error: "Failed to generate verification code" };
  }
}

// VERIFY MFA CODE
export async function verifyMFACode(
  userId: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.mfaCode || !user.mfaCodeExpiry) {
      return { success: false, error: "No verification code found" };
    }

    if (user.mfaCodeExpiry < new Date()) {
      return { success: false, error: "Verification code has expired" };
    }

    if (user.mfaCode !== code) {
      return { success: false, error: "Invalid verification code" };
    }

    // Clear MFA code after successful verification
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaCode: null,
        mfaCodeExpiry: null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Verify MFA code error:", error);
    return { success: false, error: "Failed to verify code" };
  }
}

// VERIFY MFA CODE DURING LOGIN
export async function verifyMFALogin(email: string, code: string): Promise<AuthPayload> {
  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: {
        organizationMembers: {
          select: {
            organizationId: true,
            role: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return { success: false, error: "Invalid email or verification code" };
    }

    if (!user.mfaEnabled) {
      return { success: false, error: "MFA is not enabled for this account" };
    }

    if (!user.mfaCode || !user.mfaCodeExpiry) {
      return { success: false, error: "No verification code found. Please try logging in again." };
    }

    if (user.mfaCodeExpiry < new Date()) {
      return { success: false, error: "Verification code has expired. Please try logging in again." };
    }

    if (user.mfaCode !== code) {
      return { success: false, error: "Invalid verification code" };
    }

    // Clear MFA code after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaCode: null,
        mfaCodeExpiry: null,
      },
    });

    // Generate token for successful login
    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        organizationId: user.organizationMembers[0]?.organizationId,
      },
    };
  } catch (error) {
    console.error("Verify MFA login error:", error);
    return { success: false, error: "Failed to verify code" };
  }
}

// MFA SETTINGS - Enable MFA (Step 1: Request OTP)
export async function enableMFARequest(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.mfaEnabled) {
      return { success: false, error: "MFA is already enabled for this account" };
    }

    // Generate MFA code
    const mfaResult = await generateMFACode(userId);
    
    if (!mfaResult.success || !mfaResult.code) {
      return { success: false, error: "Failed to generate verification code" };
    }

    // Send MFA code via email
    try {
      await sendMFACodeEmail(user.email, mfaResult.code, user.name || undefined);
    } catch (emailError) {
      console.error("Failed to send MFA email:", emailError);
      // Clear the MFA code since we couldn't send it
      await prisma.user.update({
        where: { id: userId },
        data: { mfaCode: null, mfaCodeExpiry: null },
      });
      return { success: false, error: "Failed to send verification code" };
    }

    return { success: true };
  } catch (error) {
    console.error("Enable MFA request error:", error);
    return { success: false, error: "Failed to process request" };
  }
}

// MFA SETTINGS - Confirm and Enable MFA (Step 2: Verify OTP)
export async function confirmEnableMFA(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.mfaEnabled) {
      return { success: false, error: "MFA is already enabled for this account" };
    }

    // Verify the MFA code
    const verifyResult = await verifyMFACode(userId, code);
    
    if (!verifyResult.success) {
      return verifyResult;
    }

    // Enable MFA
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Confirm enable MFA error:", error);
    return { success: false, error: "Failed to enable MFA" };
  }
}

// MFA SETTINGS - Disable MFA
export async function disableMFA(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (!user.mfaEnabled) {
      return { success: false, error: "MFA is not enabled for this account" };
    }

    // First, generate a code if one doesn't exist (for security verification)
    if (!user.mfaCode || !user.mfaCodeExpiry || user.mfaCodeExpiry < new Date()) {
      const mfaResult = await generateMFACode(userId);
      
      if (!mfaResult.success || !mfaResult.code) {
        return { success: false, error: "Failed to generate verification code" };
      }

      // Send MFA code via email
      try {
        await sendMFACodeEmail(user.email, mfaResult.code, user.name || undefined);
      } catch (emailError) {
        console.error("Failed to send MFA email:", emailError);
        return { success: false, error: "Failed to send verification code" };
      }

      return { success: false, error: "Verification code sent. Please provide the code to disable MFA." };
    }

    // Verify the provided code
    const verifyResult = await verifyMFACode(userId, code);
    
    if (!verifyResult.success) {
      return verifyResult;
    }

    // Disable MFA
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false },
    });

    return { success: true };
  } catch (error) {
    console.error("Disable MFA error:", error);
    return { success: false, error: "Failed to disable MFA" };
  }
}
