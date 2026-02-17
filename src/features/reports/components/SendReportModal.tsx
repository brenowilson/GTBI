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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SendReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string;
  onConfirm: (channels: ("email" | "whatsapp")[]) => void;
}

export function SendReportModal({
  open,
  onOpenChange,
  reportId: _reportId,
  onConfirm,
}: SendReportModalProps) {
  const [emailChecked, setEmailChecked] = useState(false);
  const [whatsappChecked, setWhatsappChecked] = useState(false);

  const hasSelection = emailChecked || whatsappChecked;

  function handleConfirm() {
    const channels: ("email" | "whatsapp")[] = [];
    if (emailChecked) channels.push("email");
    if (whatsappChecked) channels.push("whatsapp");
    onConfirm(channels);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Relatório</DialogTitle>
          <DialogDescription>
            Selecione os canais para envio do relatório.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-channel"
              checked={emailChecked}
              onCheckedChange={(checked) => setEmailChecked(checked === true)}
            />
            <Label htmlFor="email-channel">Email</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="whatsapp-channel"
              checked={whatsappChecked}
              onCheckedChange={(checked) => setWhatsappChecked(checked === true)}
            />
            <Label htmlFor="whatsapp-channel">WhatsApp</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!hasSelection}>
            Confirmar envio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
