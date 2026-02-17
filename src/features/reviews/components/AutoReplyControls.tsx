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
import { ConfirmToggleModal } from "./ConfirmToggleModal";

interface RestaurantAutoReplySettings {
  id: string;
  name: string;
  enabled: boolean;
  mode: "ai" | "template";
}

interface AutoReplyControlsProps {
  globalEnabled: boolean;
  globalMode: "ai" | "template";
  restaurants: RestaurantAutoReplySettings[];
  onGlobalToggle?: (enabled: boolean) => void;
  onGlobalModeChange?: (mode: "ai" | "template") => void;
  onRestaurantToggle?: (restaurantId: string, enabled: boolean) => void;
}

export function AutoReplyControls({
  globalEnabled,
  globalMode,
  restaurants,
  onGlobalToggle,
  onGlobalModeChange,
  onRestaurantToggle,
}: AutoReplyControlsProps) {
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
          <CardTitle>Configurações de Auto-resposta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Configuração Global</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="global-toggle">Auto-resposta ativa</Label>
              <Switch
                id="global-toggle"
                checked={globalEnabled}
                onCheckedChange={(checked) =>
                  requestConfirmation(
                    checked
                      ? "ativar a auto-resposta global"
                      : "desativar a auto-resposta global",
                    () => onGlobalToggle?.(checked)
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="global-mode">
                Modo: {globalMode === "ai" ? "IA" : "Template"}
              </Label>
              <Switch
                id="global-mode"
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
                        ? `ativar a auto-resposta para ${restaurant.name}`
                        : `desativar a auto-resposta para ${restaurant.name}`,
                      () => onRestaurantToggle?.(restaurant.id, checked)
                    )
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmToggleModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        action={pendingAction?.description ?? ""}
        onConfirm={handleConfirm}
      />
    </>
  );
}
