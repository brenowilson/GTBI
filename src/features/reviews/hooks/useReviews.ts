import { useQuery } from "@tanstack/react-query";
import { reviewRepository } from "@/shared/repositories/supabase";
import { useRestaurantStore } from "@/stores/restaurant.store";
import type { ReviewFilters } from "@/shared/repositories/interfaces";

export function useReviews(filters?: ReviewFilters) {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["reviews", selectedRestaurant?.id, filters],
    queryFn: () => reviewRepository.getByRestaurant(selectedRestaurant!.id, filters),
    enabled: !!selectedRestaurant?.id,
  });
}
