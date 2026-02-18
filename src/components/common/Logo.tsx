import { useTheme } from "@/app/providers/ThemeProvider";
import { cn } from "@/shared/lib/cn";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "h-8",
  md: "h-10",
  lg: "h-16",
} as const;

export function Logo({ className, size = "md" }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  return (
    <img
      src={src}
      alt="GTBI"
      className={cn(SIZE_CLASSES[size], "w-auto", className)}
    />
  );
}
