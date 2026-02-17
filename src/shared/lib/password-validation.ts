export interface PasswordStrengthResult {
  isValid: boolean;
  score: number;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function validatePassword(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const isValid = checks.minLength && checks.hasUppercase && checks.hasNumber;

  return { isValid, score, checks };
}
