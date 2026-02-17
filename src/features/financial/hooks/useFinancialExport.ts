import { useMutation } from "@tanstack/react-query";
import { exportFinancialData } from "../useCases/exportFinancialData";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { useToast } from "@/shared/hooks/use-toast";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function useFinancialExport() {
  const { toast } = useToast();
  const { selectedRestaurant } = useRestaurantStore();

  return useMutation({
    mutationFn: ({
      startDate,
      endDate,
      format,
    }: {
      startDate: string;
      endDate: string;
      format: "csv" | "xls";
    }) =>
      exportFinancialData({
        restaurantId: selectedRestaurant!.id,
        startDate,
        endDate,
        format,
      }),
    onSuccess: (result, variables) => {
      if (result.success) {
        const extension = variables.format === "csv" ? "csv" : "xlsx";
        const restaurantName = selectedRestaurant?.name ?? "financeiro";
        const filename = `${restaurantName}-${variables.startDate}-${variables.endDate}.${extension}`;
        downloadBlob(result.data, filename);
        toast({
          title: "Exportação concluída",
          description: "O arquivo financeiro foi baixado com sucesso.",
        });
      } else {
        toast({
          title: "Erro na exportação",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
