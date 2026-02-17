import { useQuery } from "@tanstack/react-query";
import { catalogRepository } from "@/shared/repositories/supabase";
import { useRestaurantStore } from "@/stores/restaurant.store";
import type { CatalogFilters } from "@/shared/repositories/interfaces";

export function useCatalogItems(filters?: CatalogFilters) {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["catalog", "items", selectedRestaurant?.id, filters],
    queryFn: () =>
      catalogRepository.getItemsByRestaurant(selectedRestaurant!.id, filters),
    enabled: !!selectedRestaurant?.id,
  });
}

export function useCatalogCategories() {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["catalog", "categories", selectedRestaurant?.id],
    queryFn: () =>
      catalogRepository.getCategoriesByRestaurant(selectedRestaurant!.id),
    enabled: !!selectedRestaurant?.id,
  });
}
