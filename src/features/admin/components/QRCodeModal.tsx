import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWhatsAppInstanceStatus } from "../hooks";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string | null;
  initialQrCode?: string;
  onConnected: () => void;
}

export function QRCodeModal({
  open,
  onOpenChange,
  instanceId,
  initialQrCode,
  onConnected,
}: QRCodeModalProps) {
  const [countdown, setCountdown] = useState(120);
  const { data: statusData } = useWhatsAppInstanceStatus(open ? instanceId : null);

  // Get the latest QR code from status polling or initial data
  const qrcode = statusData?.qrcode ?? initialQrCode;
  const isConnected = statusData?.connected || statusData?.instance?.status === "connected";

  // Handle connected state
  useEffect(() => {
    if (isConnected) {
      onConnected();
      onOpenChange(false);
    }
  }, [isConnected, onConnected, onOpenChange]);

  // Countdown timer
  useEffect(() => {
    if (!open) {
      setCountdown(120);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const isExpired = countdown === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o QR code com o WhatsApp do celular para conectar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {qrcode && !isExpired ? (
            <>
              <div className="rounded-lg border bg-white p-4">
                <img
                  src={qrcode}
                  alt="QR Code WhatsApp"
                  className="h-64 w-64"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Expira em {minutes}:{seconds.toString().padStart(2, "0")}
              </p>
            </>
          ) : isExpired ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">
                O QR code expirou.
              </p>
              <Button variant="outline" onClick={() => { setCountdown(120); onOpenChange(false); }}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Abra o WhatsApp no celular &rarr; Menu &rarr; Dispositivos conectados &rarr; Conectar dispositivo
        </p>
      </DialogContent>
    </Dialog>
  );
}
