import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/shared/lib/cn";

interface FunnelStepCardProps {
  step: string;
  current: number;
  previous: number;
}

function formatDiff(current: number, previous: number) {
  const absoluteDiff = current - previous;
  const percentageDiff =
    previous === 0 ? 0 : ((absoluteDiff / previous) * 100);

  return { absoluteDiff, percentageDiff };
}

export function FunnelStepCard({
  step,
  current,
  previous,
}: FunnelStepCardProps) {
  const { absoluteDiff, percentageDiff } = formatDiff(current, previous);
  const isPositive = absoluteDiff >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {step}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{current.toLocaleString("pt-BR")}</div>
        <div className="mt-1 flex items-center gap-1 text-sm">
          <span
            className={cn(
              "font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {isPositive ? "+" : ""}
            {absoluteDiff.toLocaleString("pt-BR")}
          </span>
          <span
            className={cn(
              "text-xs",
              isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            ({isPositive ? "+" : ""}
            {percentageDiff.toFixed(1)}%)
          </span>
          <span className="text-xs text-muted-foreground">
            vs semana anterior
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
