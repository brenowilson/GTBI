import { Button } from "@/components/ui/button";
import { ActionCard } from "./ActionCard";
import type { ActionStatus, ActionType } from "@/entities/action/model";

interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  actionType: ActionType;
  status: ActionStatus;
}

interface ActionsListProps {
  actions: ActionItem[];
  onCreate: () => void;
  onMarkDone?: (id: string) => void;
  onDiscard?: (id: string) => void;
}

export function ActionsList({
  actions,
  onCreate,
  onMarkDone,
  onDiscard,
}: ActionsListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ações</h3>
        <Button size="sm" onClick={onCreate}>
          Nova ação
        </Button>
      </div>

      {actions.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma ação cadastrada ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onMarkDone={onMarkDone}
              onDiscard={onDiscard}
            />
          ))}
        </div>
      )}
    </div>
  );
}
