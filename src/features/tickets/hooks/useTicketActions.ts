import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ticketRepository } from "@/shared/repositories/supabase";
import { sendTicketMessage } from "../useCases/sendTicketMessage";
import { updateTicketStatus } from "../useCases/updateTicketStatus";
import { useToast } from "@/shared/hooks/use-toast";

export function useSendTicketMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: sendTicketMessage,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
        toast({
          title: "Mensagem enviada",
          description: "A mensagem foi enviada com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao enviar mensagem",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAutoRespondToTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (ticketId: string) => ticketRepository.autoRespond(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({
        title: "Resposta automática enviada",
        description: "A resposta automática foi gerada e enviada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na resposta automática",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateTicketStatus,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
        toast({
          title: "Status atualizado",
          description: "O status do chamado foi atualizado.",
        });
      } else {
        toast({
          title: "Erro ao atualizar status",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
