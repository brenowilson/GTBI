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

interface MarkDoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (evidence: string) => void;
}

export function MarkDoneModal({
  open,
  onOpenChange,
  onConfirm,
}: MarkDoneModalProps) {
  const [evidence, setEvidence] = useState("");

  function handleConfirm() {
    onConfirm(evidence);
    setEvidence("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como Concluída</DialogTitle>
          <DialogDescription>
            Descreva a evidência de que a ação foi realizada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="evidence">Evidência</Label>
          <Textarea
            id="evidence"
            placeholder="Descreva o que foi feito e os resultados obtidos..."
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={evidence.trim().length === 0}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
