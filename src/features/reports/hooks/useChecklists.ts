import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checklistRepository } from "@/shared/repositories/supabase";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { useToast } from "@/shared/hooks/use-toast";
import type { ChecklistFilters } from "@/shared/repositories/interfaces";

export function useChecklists(filters?: ChecklistFilters) {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["checklists", selectedRestaurant?.id, filters],
    queryFn: () => checklistRepository.getByRestaurant(selectedRestaurant!.id, filters),
    enabled: !!selectedRestaurant?.id,
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, isChecked }: { id: string; isChecked: boolean }) =>
      checklistRepository.toggleCheck(id, isChecked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      toast({
        title: "Checklist atualizado",
        description: "O item do checklist foi atualizado.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar checklist",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
