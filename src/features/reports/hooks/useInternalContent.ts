import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportRepository } from "@/shared/repositories/supabase";
import { updateInternalContent } from "../useCases/updateInternalContent";
import { useToast } from "@/shared/hooks/use-toast";

export function useInternalContent(reportId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["reports", "internal-content", reportId],
    queryFn: () => reportRepository.getInternalContent(reportId!),
    enabled: !!reportId,
  });

  const updateMutation = useMutation({
    mutationFn: (content: string) =>
      updateInternalContent({ reportId: reportId!, content }),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["reports", "internal-content", reportId],
        });
        toast({
          title: "Conteúdo salvo",
          description: "As anotações internas foram atualizadas.",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    internalContent: query.data,
    isLoading: query.isLoading,
    update: updateMutation,
  };
}
