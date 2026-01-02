import { randomBytes } from "crypto";

export interface OTPConfig {
  length: number;
  expiryMinutes: number;
}

const DEFAULT_CONFIG: OTPConfig = {
  length: 6,
  expiryMinutes: 10,
};

export function generateOTP(config: Partial<OTPConfig> = {}): {
  code: string;
  expiresAt: Date;
} {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const code = randomBytes(finalConfig.length / 2)
    .toString("hex")
    .substring(0, finalConfig.length)
    .padStart(finalConfig.length, "0");

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + finalConfig.expiryMinutes);

  return { code, expiresAt };
}

export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

export function verifyOTPCode(provided: string, stored: string): boolean {
  return provided === stored;
}
