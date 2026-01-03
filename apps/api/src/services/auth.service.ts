import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../utils/jwt.js";
import { validatePassword } from "../utils/password-validation.js";

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
          name: organizationName,
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
export async function forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.passwordHash) {
      // Don't reveal if user exists for security
      return { success: true };
    }

    // Generate reset token (random string)
    const crypto = await import("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { success: false, error: "Failed to process password reset request" };
  }
}

// RESET PASSWORD - Validate token and update password
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.errors[0] };
    }

    const user = await prisma.user.findUnique({ 
      where: { resetToken: token } 
    });

    if (!user || !user.resetTokenExpiry) {
      return { success: false, error: "Invalid or expired reset token" };
    }

    if (user.resetTokenExpiry < new Date()) {
      return { success: false, error: "Reset token has expired" };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true };
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
