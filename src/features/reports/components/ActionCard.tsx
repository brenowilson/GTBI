import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/shared/lib/cn";
import type { ActionStatus, ActionType } from "@/entities/action/model";

interface ActionCardProps {
  action: {
    id: string;
    title: string;
    description: string | null;
    goal: string | null;
    actionType: ActionType;
    status: ActionStatus;
  };
  onMarkDone?: (id: string) => void;
  onDiscard?: (id: string) => void;
}

const statusLabels: Record<ActionStatus, string> = {
  planned: "Planejada",
  done: "Concluída",
  discarded: "Descartada",
};

const statusStyles: Record<ActionStatus, string> = {
  planned: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-green-100 text-green-800 border-green-200",
  discarded: "bg-gray-100 text-gray-800 border-gray-200",
};

const actionTypeLabels: Record<ActionType, string> = {
  menu_adjustment: "Ajuste de Cardápio",
  promotion: "Promoção",
  response: "Resposta",
  operational: "Operacional",
  marketing: "Marketing",
  other: "Outro",
};

export function ActionCard({ action, onMarkDone, onDiscard }: ActionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{action.title}</CardTitle>
          <Badge
            variant="outline"
            className={cn(statusStyles[action.status])}
          >
            {statusLabels[action.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2 text-sm">
          <Badge variant="secondary" className="text-xs">
            {actionTypeLabels[action.actionType]}
          </Badge>
          {action.description && (
            <p className="text-muted-foreground">{action.description}</p>
          )}
          {action.goal && (
            <p className="text-muted-foreground">
              <span className="font-medium">Objetivo:</span> {action.goal}
            </p>
          )}
        </div>
      </CardContent>
      {action.status === "planned" && (
        <CardFooter className="gap-2">
          <Button
            size="sm"
            onClick={() => onMarkDone?.(action.id)}
          >
            Marcar como feito
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDiscard?.(action.id)}
          >
            Descartar
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
