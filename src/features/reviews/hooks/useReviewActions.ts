import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewRepository } from "@/shared/repositories/supabase";
import { respondToReview } from "../useCases/respondToReview";
import { useToast } from "@/shared/hooks/use-toast";

export function useRespondToReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: respondToReview,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        toast({
          title: "Resposta enviada",
          description: "A resposta à avaliação foi enviada com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao responder",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao responder",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAutoRespondToReview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (reviewId: string) => reviewRepository.autoRespond(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
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
