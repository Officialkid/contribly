import { z } from "zod";

// Registration schema
export const registerSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").trim(),
  organizationName: z.string().min(1, "Organization name is required").max(100, "Organization name must be less than 100 characters").trim(),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// MFA code schema
export const mfaCodeSchema = z.object({
  code: z.string().length(6, "Verification code must be exactly 6 digits").regex(/^\d+$/, "Verification code must contain only digits"),
});

// MFA login schema
export const mfaLoginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  code: z.string().length(6, "Verification code must be exactly 6 digits").regex(/^\d+$/, "Verification code must contain only digits"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type MFACodeInput = z.infer<typeof mfaCodeSchema>;
export type MFALoginInput = z.infer<typeof mfaLoginSchema>;
