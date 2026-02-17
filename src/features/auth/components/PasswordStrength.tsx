import { validatePassword } from "@/shared/lib/password-validation";
import { cn } from "@/shared/lib/cn";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, checks } = validatePassword(password);

  if (!password) return null;

  const strengthLabel = score <= 1 ? "Fraca" : score <= 2 ? "Média" : score <= 3 ? "Boa" : "Forte";
  const strengthColor =
    score <= 1
      ? "bg-destructive"
      : score <= 2
        ? "bg-yellow-500"
        : score <= 3
          ? "bg-blue-500"
          : "bg-green-500";

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              score >= level ? strengthColor : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Força: {strengthLabel}</p>
      <ul className="space-y-1 text-xs text-muted-foreground">
        <li className={cn(checks.minLength && "text-green-600 dark:text-green-400")}>
          {checks.minLength ? "✓" : "○"} Mínimo 8 caracteres
        </li>
        <li className={cn(checks.hasUppercase && "text-green-600 dark:text-green-400")}>
          {checks.hasUppercase ? "✓" : "○"} Uma letra maiúscula
        </li>
        <li className={cn(checks.hasNumber && "text-green-600 dark:text-green-400")}>
          {checks.hasNumber ? "✓" : "○"} Um número
        </li>
        <li className={cn(checks.hasSpecial && "text-green-600 dark:text-green-400")}>
          {checks.hasSpecial ? "✓" : "○"} Um caractere especial (opcional)
        </li>
      </ul>
    </div>
  );
}
