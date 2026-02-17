import { useQuery } from "@tanstack/react-query";
import { getPerformanceData } from "../useCases/getPerformanceData";
import { useRestaurantStore } from "@/stores/restaurant.store";

export function usePerformanceData() {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["performance", selectedRestaurant?.id],
    queryFn: async () => {
      const result = await getPerformanceData(selectedRestaurant!.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
    enabled: !!selectedRestaurant?.id,
  });
}
