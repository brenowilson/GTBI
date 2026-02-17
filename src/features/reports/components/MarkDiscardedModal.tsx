import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MarkDiscardedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function MarkDiscardedModal({
  open,
  onOpenChange,
  onConfirm,
}: MarkDiscardedModalProps) {
  const [reason, setReason] = useState("");

  function handleConfirm() {
    onConfirm(reason);
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Descartar Ação</DialogTitle>
          <DialogDescription>
            Informe o motivo para descartar esta ação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="discard-reason">Motivo</Label>
          <Textarea
            id="discard-reason"
            placeholder="Explique por que esta ação não será realizada..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={reason.trim().length === 0}
          >
            Confirmar descarte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
