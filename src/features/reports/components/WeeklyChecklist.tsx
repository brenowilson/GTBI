import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ChecklistItem {
  id: string;
  title: string;
  isChecked: boolean;
}

interface WeeklyChecklistProps {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
}

export function WeeklyChecklist({ items, onToggle }: WeeklyChecklistProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Checklist Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start space-x-3 rounded-lg border p-3"
            >
              <Checkbox
                id={`checklist-${item.id}`}
                checked={item.isChecked}
                onCheckedChange={() => onToggle(item.id)}
              />
              <div className="flex-1">
                <Label
                  htmlFor={`checklist-${item.id}`}
                  className="cursor-pointer text-sm font-medium"
                >
                  {item.title}
                </Label>
                {item.isChecked && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Concluído
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
