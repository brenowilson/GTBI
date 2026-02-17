import { useQuery } from "@tanstack/react-query";
import { financialRepository } from "@/shared/repositories/supabase";
import { useRestaurantStore } from "@/stores/restaurant.store";
import type { FinancialFilters } from "@/shared/repositories/interfaces";

export function useFinancialEntries(filters?: FinancialFilters) {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["financial", "entries", selectedRestaurant?.id, filters],
    queryFn: () =>
      financialRepository.getByRestaurant(selectedRestaurant!.id, filters),
    enabled: !!selectedRestaurant?.id,
  });
}

export function useFinancialSummary(startDate: string, endDate: string) {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["financial", "summary", selectedRestaurant?.id, startDate, endDate],
    queryFn: () =>
      financialRepository.getSummary(selectedRestaurant!.id, startDate, endDate),
    enabled: !!selectedRestaurant?.id && !!startDate && !!endDate,
  });
}
