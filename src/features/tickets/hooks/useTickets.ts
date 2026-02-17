import { useQuery } from "@tanstack/react-query";
import { ticketRepository } from "@/shared/repositories/supabase";
import { useRestaurantStore } from "@/stores/restaurant.store";
import type { TicketFilters } from "@/shared/repositories/interfaces";

export function useTickets(filters?: TicketFilters) {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["tickets", selectedRestaurant?.id, filters],
    queryFn: () => ticketRepository.getByRestaurant(selectedRestaurant!.id, filters),
    enabled: !!selectedRestaurant?.id,
  });
}
