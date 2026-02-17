import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeSubscription } from "@/shared/hooks/useRealtimeSubscription";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { toast } from "@/shared/hooks/use-toast";

interface ReportRow extends Record<string, unknown> {
  id: string;
  restaurant_id: string;
  status: string;
  week_label?: string;
}

const STATUS_LABELS: Record<string, { title: string; description: string }> = {
  sent: {
    title: "Relatório enviado",
    description: "O relatório foi enviado com sucesso.",
  },
  failed: {
    title: "Falha no envio",
    description: "Houve um erro ao enviar o relatório. Tente novamente.",
  },
  generated: {
    title: "Relatório gerado",
    description: "O relatório semanal foi gerado e está disponível.",
  },
};

export function useReportRealtime() {
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  const restaurantId = selectedRestaurant?.id;

  useRealtimeSubscription<ReportRow>(
    {
      table: "reports",
      filter: restaurantId
        ? `restaurant_id=eq.${restaurantId}`
        : undefined,
      event: "UPDATE",
      onPayload: (payload) => {
        queryClient.invalidateQueries({ queryKey: ["reports"] });

        const newRecord = payload.new as ReportRow | undefined;
        const label = newRecord?.status
          ? STATUS_LABELS[newRecord.status]
          : undefined;
        if (label) {
          const weekInfo = newRecord?.week_label
            ? ` (${newRecord.week_label})`
            : "";
          toast({
            title: label.title,
            description: `${label.description}${weekInfo}`,
          });
        }
      },
    },
    !!restaurantId
  );
}
