// Password validation utilities

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3; // 0: very weak, 1: weak, 2: medium, 3: strong
  label: "Very Weak" | "Weak" | "Medium" | "Strong";
  color: string;
  percentage: number;
  feedback: string[];
}

export interface PasswordRequirements {
  minLength: boolean;
  hasNumber: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
}

const MIN_PASSWORD_LENGTH = 8;

/**
 * Check if password meets all requirements
 */
export function checkPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= MIN_PASSWORD_LENGTH,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
  };
}

/**
 * Check if password is valid (meets all requirements)
 */
export function isPasswordValid(password: string): boolean {
  const requirements = checkPasswordRequirements(password);
  return Object.values(requirements).every(Boolean);
}

/**
 * Calculate password strength
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: "Very Weak",
      color: "#ef4444",
      percentage: 0,
      feedback: ["Password is required"],
    };
  }

  const requirements = checkPasswordRequirements(password);
  const feedback: string[] = [];
  let score = 0;

  // Check basic requirements
  if (!requirements.minLength) {
    feedback.push(`At least ${MIN_PASSWORD_LENGTH} characters required`);
  } else {
    score += 1;
  }

  if (!requirements.hasNumber) {
    feedback.push("Add at least one number");
  } else {
    score += 0.33;
  }

  if (!requirements.hasUppercase) {
    feedback.push("Add at least one uppercase letter");
  } else {
    score += 0.33;
  }

  if (!requirements.hasLowercase) {
    feedback.push("Add at least one lowercase letter");
  } else {
    score += 0.33;
  }

  // Additional strength checks
  if (password.length >= 12) {
    score += 0.5;
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 0.5;
    if (feedback.length === 0) {
      feedback.push("Strong password with special characters");
    }
  } else if (feedback.length === 0) {
    feedback.push("Consider adding special characters for extra security");
  }

  // Penalize common patterns
  if (/^[0-9]+$/.test(password)) {
    score -= 1;
    feedback.push("Don't use only numbers");
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    score -= 0.5;
    feedback.push("Add numbers or special characters");
  }

  if (/(123|abc|password|qwerty)/i.test(password)) {
    score -= 1;
    feedback.push("Avoid common patterns like '123' or 'password'");
  }

  // Normalize score to 0-3 range
  const normalizedScore = Math.max(0, Math.min(3, Math.floor(score)));

  // Determine label and color
  let label: PasswordStrength["label"];
  let color: string;
  let percentage: number;

  if (normalizedScore === 0) {
    label = "Very Weak";
    color = "#ef4444"; // red-500
    percentage = 25;
  } else if (normalizedScore === 1) {
    label = "Weak";
    color = "#f97316"; // orange-500
    percentage = 50;
  } else if (normalizedScore === 2) {
    label = "Medium";
    color = "#eab308"; // yellow-500
    percentage = 75;
  } else {
    label = "Strong";
    color = "#22c55e"; // green-500
    percentage = 100;
  }

  return {
    score: normalizedScore as 0 | 1 | 2 | 3,
    label,
    color,
    percentage,
    feedback: feedback.length > 0 ? feedback : ["Excellent password!"],
  };
}

/**
 * Get validation error message if password doesn't meet requirements
 */
export function getPasswordValidationError(password: string): string | null {
  if (!password) {
    return "Password is required";
  }

  const requirements = checkPasswordRequirements(password);

  if (!requirements.minLength) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (!requirements.hasNumber) {
    return "Password must contain at least one number";
  }

  if (!requirements.hasUppercase) {
    return "Password must contain at least one uppercase letter";
  }

  if (!requirements.hasLowercase) {
    return "Password must contain at least one lowercase letter";
  }

  return null;
}
