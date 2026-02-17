import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { toggleAutoReply } from "../useCases/toggleAutoReply";
import { updateAutoReplySettings } from "../useCases/updateAutoReplySettings";
import { useToast } from "@/shared/hooks/use-toast";
import type { UpdateAutoReplySettingsInput } from "../useCases/updateAutoReplySettings";

export function useAutoReplySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedRestaurant, setSelectedRestaurant } = useRestaurantStore();

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      toggleAutoReply({
        restaurantId: selectedRestaurant!.id,
        enabled,
      }),
    onSuccess: (result) => {
      if (result.success) {
        setSelectedRestaurant(result.data);
        queryClient.invalidateQueries({ queryKey: ["restaurants"] });
        toast({
          title: result.data.review_auto_reply_enabled
            ? "Resposta automática ativada"
            : "Resposta automática desativada",
          description: result.data.review_auto_reply_enabled
            ? "As avaliações serão respondidas automaticamente."
            : "As avaliações precisarão de resposta manual.",
        });
      } else {
        toast({
          title: "Erro ao alterar configuração",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar configuração",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (input: Omit<UpdateAutoReplySettingsInput, "restaurantId">) =>
      updateAutoReplySettings({
        restaurantId: selectedRestaurant!.id,
        ...input,
      }),
    onSuccess: (result) => {
      if (result.success) {
        setSelectedRestaurant(result.data);
        queryClient.invalidateQueries({ queryKey: ["restaurants"] });
        toast({
          title: "Configurações salvas",
          description: "As configurações de resposta automática foram atualizadas.",
        });
      } else {
        toast({
          title: "Erro ao salvar configurações",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    isEnabled: selectedRestaurant?.review_auto_reply_enabled ?? false,
    mode: selectedRestaurant?.review_auto_reply_mode ?? "template",
    template: selectedRestaurant?.review_reply_template ?? null,
    aiPrompt: selectedRestaurant?.review_ai_prompt ?? null,
    toggle: toggleMutation,
    updateSettings: updateSettingsMutation,
  };
}
