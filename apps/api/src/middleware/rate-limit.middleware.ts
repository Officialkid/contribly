import rateLimit from "express-rate-limit";

function buildJsonLimiter(message: string, windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

export const apiLimiter = buildJsonLimiter(
  "Too many API requests from this IP. Please try again shortly.",
  15 * 60 * 1000,
  300
);

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    error: "Too many password reset requests. Please try again in 1 hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many registration attempts. Please try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const mfaLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: "Too many MFA verification attempts. Please try again in 10 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { success: false, error: "Too many password reset attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpRequestLimiter = buildJsonLimiter(
  "Too many verification code requests. Please try again in 10 minutes.",
  10 * 60 * 1000,
  5
);

export const withdrawalOtpLimiter = buildJsonLimiter(
  "Too many OTP actions for this withdrawal. Please try again in 10 minutes.",
  10 * 60 * 1000,
  5
);

export const adminActionLimiter = buildJsonLimiter(
  "Too many sensitive admin actions. Please try again shortly.",
  10 * 60 * 1000,
  20
);
