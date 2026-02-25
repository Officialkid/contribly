import rateLimit from "express-rate-limit";

// Login rate limiter: 5 attempts per 15 minutes per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many login attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Forgot password rate limiter: 3 attempts per hour per IP
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts
  message: "Too many password reset requests. Please try again in 1 hour.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration rate limiter: 10 per hour per IP
export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts
  message: "Too many registration attempts. Please try again in 1 hour.",
  standardHeaders: true,
  legacyHeaders: false,
});

// MFA verification rate limiter: 5 attempts per 10 minutes
export const mfaLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 attempts
  message: "Too many MFA verification attempts. Please try again in 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Reset password rate limiter: 3 attempts per 15 minutes per IP
export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts
  message: "Too many password reset attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});
