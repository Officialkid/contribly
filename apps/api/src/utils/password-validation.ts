/**
 * Password validation utility - Backend
 * Matches frontend validation rules
 */

interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

const MIN_PASSWORD_LENGTH = 8;

/**
 * Validate password against all requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
    return { valid: false, errors };
  }

  // Check minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number (0-9)");
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
  }

  // Check for common weak patterns
  const weakPatterns = [
    /^[0-9]+$/,  // Only numbers
    /(123|abc|password|qwerty|admin|letmein)/i,  // Common patterns
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      errors.push("Password contains common patterns that are easy to guess");
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if password is valid (meets all requirements)
 */
export function isPasswordValid(password: string): boolean {
  return validatePassword(password).valid;
}

/**
 * Get first validation error message
 */
export function getPasswordValidationError(password: string): string | null {
  const result = validatePassword(password);
  return result.errors.length > 0 ? result.errors[0] : null;
}
