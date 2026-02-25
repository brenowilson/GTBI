import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportRepository } from "@/shared/repositories/supabase";
import { generateReportFromScreenshots } from "../useCases/generateReportFromScreenshots";
import { useToast } from "@/shared/hooks/use-toast";
import type { GenerateFromScreenshotsInput } from "@/entities/report";

export function useUploadScreenshots() {
  return useMutation({
    mutationFn: async (files: File[]) => {
      const results: Array<{ path: string }> = [];
      for (const file of files) {
        const result = await reportRepository.uploadScreenshot(file);
        results.push({ path: result.path });
      }
      return results;
    },
  });
}

export function useGenerateReportFromScreenshots() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: GenerateFromScreenshotsInput) =>
      generateReportFromScreenshots(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        toast({
          title: "Relatório em geração",
          description: "O relatório está sendo gerado em segundo plano. Você será notificado quando estiver pronto.",
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
