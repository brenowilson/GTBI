import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeSubscription } from "@/shared/hooks/useRealtimeSubscription";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { toast } from "@/shared/hooks/use-toast";

interface ImageJobRow extends Record<string, unknown> {
  id: string;
  restaurant_id: string;
  status: string;
  item_name?: string;
}

const STATUS_LABELS: Record<string, string> = {
  ready_for_approval: "pronta para aprovação",
  approved: "aprovada",
  rejected: "rejeitada",
  failed: "falhou ao gerar",
};

export function useImageJobRealtime() {
  const queryClient = useQueryClient();
  const { selectedRestaurant } = useRestaurantStore();
  const restaurantId = selectedRestaurant?.id;

  useRealtimeSubscription<ImageJobRow>(
    {
      table: "image_jobs",
      filter: restaurantId
        ? `restaurant_id=eq.${restaurantId}`
        : undefined,
      event: "UPDATE",
      onPayload: (payload) => {
        queryClient.invalidateQueries({ queryKey: ["image-jobs"] });

        const newRecord = payload.new as ImageJobRow | undefined;
        if (newRecord?.status && STATUS_LABELS[newRecord.status]) {
          const itemLabel = newRecord.item_name ?? "Imagem";
          toast({
            title: "Atualização de imagem",
            description: `${itemLabel} ${STATUS_LABELS[newRecord.status]}.`,
          });
        }
      },
    },
    !!restaurantId
  );
}
