import bcrypt from "bcrypt";

export async function hashPIN(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export function validatePIN(pin: string): {
  valid: boolean;
  error?: string;
} {
  if (!pin || pin.length < 4) {
    return { valid: false, error: "PIN must be at least 4 characters" };
  }

  if (!/^\d+$/.test(pin)) {
    return { valid: false, error: "PIN must contain only digits" };
  }

  return { valid: true };
}
