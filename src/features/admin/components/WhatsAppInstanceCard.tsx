import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Wifi, WifiOff, Trash2, QrCode } from "lucide-react";
import type { WhatsAppInstance } from "@/entities/whatsapp-instance";

interface WhatsAppInstanceCardProps {
  instance: WhatsAppInstance;
  onConnect: (instanceId: string) => void;
  onDisconnect: (instanceId: string) => void;
  onDelete: (instanceId: string) => void;
}

export function WhatsAppInstanceCard({ instance, onConnect, onDisconnect, onDelete }: WhatsAppInstanceCardProps) {
  const statusConfig = {
    connected: { label: "Conectado", variant: "default" as const, icon: Wifi },
    connecting: { label: "Conectando...", variant: "secondary" as const, icon: QrCode },
    disconnected: { label: "Desconectado", variant: "outline" as const, icon: WifiOff },
  };

  const config = statusConfig[instance.status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Smartphone className="h-4 w-4" />
          {instance.name}
        </CardTitle>
        <Badge variant={config.variant}>
          <StatusIcon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {instance.phone_number && (
          <p className="text-sm text-muted-foreground">
            Telefone: {instance.phone_number}
          </p>
        )}
        {instance.profile_name && (
          <p className="text-sm text-muted-foreground">
            Perfil: {instance.profile_name}
          </p>
        )}
        {instance.webhook_enabled && (
          <p className="text-xs text-muted-foreground">
            Webhook: ativo
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {instance.status === "disconnected" && (
            <Button size="sm" onClick={() => onConnect(instance.id)}>
              <QrCode className="mr-1 h-4 w-4" />
              Conectar
            </Button>
          )}
          {instance.status === "connected" && (
            <Button size="sm" variant="outline" onClick={() => onDisconnect(instance.id)}>
              <WifiOff className="mr-1 h-4 w-4" />
              Desconectar
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(instance.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
