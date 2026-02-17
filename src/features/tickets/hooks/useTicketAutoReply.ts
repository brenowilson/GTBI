import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRestaurantStore } from "@/stores/restaurant.store";
import {
  toggleTicketAutoReply,
  updateTicketAutoReplySettings,
} from "../useCases/toggleTicketAutoReply";
import { useToast } from "@/shared/hooks/use-toast";
import type { UpdateTicketAutoReplySettingsInput } from "../useCases/toggleTicketAutoReply";

export function useTicketAutoReply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedRestaurant, setSelectedRestaurant } = useRestaurantStore();

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      toggleTicketAutoReply({
        restaurantId: selectedRestaurant!.id,
        enabled,
      }),
    onSuccess: (result) => {
      if (result.success) {
        setSelectedRestaurant(result.data);
        queryClient.invalidateQueries({ queryKey: ["restaurants"] });
        toast({
          title: result.data.ticket_auto_reply_enabled
            ? "Resposta automática ativada"
            : "Resposta automática desativada",
          description: result.data.ticket_auto_reply_enabled
            ? "Os chamados serão respondidos automaticamente."
            : "Os chamados precisarão de resposta manual.",
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
    mutationFn: (input: Omit<UpdateTicketAutoReplySettingsInput, "restaurantId">) =>
      updateTicketAutoReplySettings({
        restaurantId: selectedRestaurant!.id,
        ...input,
      }),
    onSuccess: (result) => {
      if (result.success) {
        setSelectedRestaurant(result.data);
        queryClient.invalidateQueries({ queryKey: ["restaurants"] });
        toast({
          title: "Configurações salvas",
          description: "As configurações de resposta automática de chamados foram atualizadas.",
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
    isEnabled: selectedRestaurant?.ticket_auto_reply_enabled ?? false,
    mode: selectedRestaurant?.ticket_auto_reply_mode ?? "template",
    template: selectedRestaurant?.ticket_reply_template ?? null,
    aiPrompt: selectedRestaurant?.ticket_ai_prompt ?? null,
    toggle: toggleMutation,
    updateSettings: updateSettingsMutation,
  };
}
