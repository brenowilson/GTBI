import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRepository } from "@/shared/repositories/supabase";
import { sendNotification } from "../useCases/sendNotification";
import { useToast } from "@/shared/hooks/use-toast";
import type { SendNotificationInput } from "@/shared/repositories/interfaces";

export function useAdminNotifications(filters?: {
  status?: string;
  channel?: string;
}) {
  return useQuery({
    queryKey: ["admin", "notifications", filters],
    queryFn: () => adminRepository.getNotifications(filters),
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: SendNotificationInput) => sendNotification(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
        toast({
          title: "Notificação enviada",
          description: "A notificação foi enviada com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao enviar notificação",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar notificação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
