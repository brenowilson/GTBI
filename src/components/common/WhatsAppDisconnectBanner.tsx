import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquareWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWhatsAppInstances } from "@/features/admin/hooks";
import { useUserPermissions } from "@/features/auth/hooks/useUserPermissions";

/**
 * Displays a dismissable banner when no WhatsApp instance is connected.
 * Only visible to admin users. Polls every 60 seconds.
 */
export function WhatsAppDisconnectBanner() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useUserPermissions();

  const { data: instances } = useWhatsAppInstances();

  // Only show to admins
  if (!isAdmin) return null;

  // Don't show if dismissed
  if (dismissed) return null;

  // Don't show while loading (instances is undefined)
  if (!instances) return null;

  // Don't show if there are no instances at all (user hasn't set up WhatsApp yet)
  if (instances.length === 0) return null;

  // Don't show if at least one instance is connected
  const hasConnected = instances.some((i) => i.status === "connected");
  if (hasConnected) return null;

  return (
    <div>
      <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 shadow-lg dark:bg-destructive/20 dark:border-destructive/40">
        <MessageSquareWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">WhatsApp desconectado</p>
          <p className="text-xs text-muted-foreground">
            Nenhuma instância WhatsApp está conectada. O envio de mensagens via WhatsApp não funcionará.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => navigate("/admin?tab=whatsapp")}
          >
            Conectar agora
          </Button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 rounded-sm p-1 text-muted-foreground hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
