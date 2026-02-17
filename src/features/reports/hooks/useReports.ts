import { useQuery } from "@tanstack/react-query";
import { reportRepository } from "@/shared/repositories/supabase";
import { useRestaurantStore } from "@/stores/restaurant.store";
import type { ReportFilters } from "@/shared/repositories/interfaces";

export function useReports(filters?: ReportFilters) {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["reports", selectedRestaurant?.id, filters],
    queryFn: () => reportRepository.getByRestaurant(selectedRestaurant!.id, filters),
    enabled: !!selectedRestaurant?.id,
  });
}
