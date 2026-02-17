import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/lib/cn";

interface AlertBadgeProps {
  type: "success" | "warning" | "danger";
  label: string;
}

const typeStyles: Record<AlertBadgeProps["type"], string> = {
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  danger: "bg-red-100 text-red-800 border-red-200",
};

export function AlertBadge({ type, label }: AlertBadgeProps) {
  return (
    <Badge variant="outline" className={cn(typeStyles[type])}>
      {label}
    </Badge>
  );
}
