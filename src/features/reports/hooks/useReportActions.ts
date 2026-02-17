import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateReport } from "../useCases/generateReport";
import { sendReport } from "../useCases/sendReport";
import { useToast } from "@/shared/hooks/use-toast";

export function useGenerateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: generateReport,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        toast({
          title: "Relatório gerado",
          description: "O relatório semanal foi gerado com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao gerar relatório",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar relatório",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: sendReport,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        toast({
          title: "Relatório enviado",
          description: "O relatório foi enviado com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao enviar relatório",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar relatório",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
