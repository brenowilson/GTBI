import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmToggleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;
  onConfirm: () => void;
}

export function ConfirmToggleModal({
  open,
  onOpenChange,
  action,
  onConfirm,
}: ConfirmToggleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar alteração</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja {action}?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
