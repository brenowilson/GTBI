import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RestaurantTicketSettings {
  id: string;
  name: string;
  enabled: boolean;
  mode: "ai" | "template";
}

interface TicketAutoReplyControlsProps {
  globalEnabled: boolean;
  globalMode: "ai" | "template";
  restaurants: RestaurantTicketSettings[];
  onGlobalToggle?: (enabled: boolean) => void;
  onGlobalModeChange?: (mode: "ai" | "template") => void;
  onRestaurantToggle?: (restaurantId: string, enabled: boolean) => void;
}

export function TicketAutoReplyControls({
  globalEnabled,
  globalMode,
  restaurants,
  onGlobalToggle,
  onGlobalModeChange,
  onRestaurantToggle,
}: TicketAutoReplyControlsProps) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    description: string;
    callback: () => void;
  } | null>(null);

  function requestConfirmation(description: string, callback: () => void) {
    setPendingAction({ description, callback });
    setConfirmModalOpen(true);
  }

  function handleConfirm() {
    pendingAction?.callback();
    setConfirmModalOpen(false);
    setPendingAction(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Auto-resposta de Chamados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Configuração Global</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="ticket-global-toggle">Auto-resposta ativa</Label>
              <Switch
                id="ticket-global-toggle"
                checked={globalEnabled}
                onCheckedChange={(checked) =>
                  requestConfirmation(
                    checked
                      ? "ativar a auto-resposta global de chamados"
                      : "desativar a auto-resposta global de chamados",
                    () => onGlobalToggle?.(checked)
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ticket-global-mode">
                Modo: {globalMode === "ai" ? "IA" : "Template"}
              </Label>
              <Switch
                id="ticket-global-mode"
                checked={globalMode === "ai"}
                onCheckedChange={(checked) =>
                  requestConfirmation(
                    checked
                      ? "alterar para o modo IA"
                      : "alterar para o modo Template",
                    () => onGlobalModeChange?.(checked ? "ai" : "template")
                  )
                }
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">
              Configuração por Restaurante
            </h4>
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{restaurant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Modo: {restaurant.mode === "ai" ? "IA" : "Template"}
                  </p>
                </div>
                <Switch
                  checked={restaurant.enabled}
                  onCheckedChange={(checked) =>
                    requestConfirmation(
                      checked
                        ? `ativar a auto-resposta de chamados para ${restaurant.name}`
                        : `desativar a auto-resposta de chamados para ${restaurant.name}`,
                      () => onRestaurantToggle?.(restaurant.id, checked)
                    )
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar alteração</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja {pendingAction?.description ?? ""}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
