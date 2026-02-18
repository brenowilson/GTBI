import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Wifi, WifiOff, QrCode, Trash2, Loader2 } from "lucide-react";
import { QRCodeModal } from "./QRCodeModal";
import {
  useWhatsAppInstances,
  useCreateWhatsAppInstance,
  useConnectWhatsAppInstance,
  useDisconnectWhatsAppInstance,
  useDeleteWhatsAppInstance,
} from "../hooks";

export function WhatsAppPanel() {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [connectingInstanceId, setConnectingInstanceId] = useState<string | null>(null);
  const [initialQrCode, setInitialQrCode] = useState<string | undefined>(undefined);
  const [isStartingConnection, setIsStartingConnection] = useState(false);

  const { data: instances, isLoading } = useWhatsAppInstances();
  const createInstance = useCreateWhatsAppInstance();
  const connectInstance = useConnectWhatsAppInstance();
  const disconnectInstance = useDisconnectWhatsAppInstance();
  const deleteInstance = useDeleteWhatsAppInstance();

  const instance = instances?.[0] ?? null;
  const isConnected = instance?.status === "connected";
  const isConnecting = instance?.status === "connecting";
  const busy = isStartingConnection || createInstance.isPending || connectInstance.isPending;

  async function handleConnect() {
    setIsStartingConnection(true);

    try {
      let targetInstanceId = instance?.id;

      // If no instance exists, create one first
      if (!targetInstanceId) {
        const newInstance = await createInstance.mutateAsync("GTBI WhatsApp");
        targetInstanceId = newInstance.id;
      }

      // Request QR code
      setConnectingInstanceId(targetInstanceId);
      const result = await connectInstance.mutateAsync({ instanceId: targetInstanceId });
      setInitialQrCode(result.qrcode);
      setQrModalOpen(true);
    } catch {
      // Toast already shown by mutation hooks
    } finally {
      setIsStartingConnection(false);
    }
  }

  function handleConnected() {
    setConnectingInstanceId(null);
    setInitialQrCode(undefined);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // No instance or disconnected — show connect button
  if (!instance || instance.status === "disconnected") {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {instance ? "WhatsApp desconectado" : "Conecte seu WhatsApp"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {instance
                  ? "A conexao com o WhatsApp foi perdida. Reconecte para continuar enviando mensagens."
                  : "Conecte um numero de WhatsApp para enviar relatorios e notificacoes."}
              </p>
            </div>
            <Button onClick={handleConnect} disabled={busy} size="lg">
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              {busy ? "Gerando QR Code..." : "Conectar WhatsApp"}
            </Button>

            {instance && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => deleteInstance.mutate(instance.id)}
                disabled={deleteInstance.isPending}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Remover instancia
              </Button>
            )}
          </CardContent>
        </Card>

        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          instanceId={connectingInstanceId}
          initialQrCode={initialQrCode}
          onConnected={handleConnected}
        />
      </>
    );
  }

  // Connected or connecting
  return (
    <>
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Wifi className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">WhatsApp</h3>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Conectado" : "Conectando..."}
                </Badge>
              </div>

              {instance.phone_number && (
                <p className="text-sm text-muted-foreground">
                  +{instance.phone_number}
                </p>
              )}
              {instance.profile_name && (
                <p className="text-sm text-muted-foreground">
                  {instance.profile_name}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => disconnectInstance.mutate(instance.id)}
                  disabled={disconnectInstance.isPending}
                >
                  <WifiOff className="mr-1 h-4 w-4" />
                  Desconectar
                </Button>
              )}
              {isConnecting && (
                <Button size="sm" onClick={handleConnect} disabled={busy}>
                  <QrCode className="mr-1 h-4 w-4" />
                  Ver QR Code
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <QRCodeModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        instanceId={connectingInstanceId}
        initialQrCode={initialQrCode}
        onConnected={handleConnected}
      />
    </>
  );
}
