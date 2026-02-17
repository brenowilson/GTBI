import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { actionRepository } from "@/shared/repositories/supabase";
import { markActionDone } from "../useCases/markActionDone";
import { markActionDiscarded } from "../useCases/markActionDiscarded";
import { createAction } from "../useCases/createAction";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { useToast } from "@/shared/hooks/use-toast";
import type { ActionFilters } from "@/shared/repositories/interfaces";
import type { CreateActionInput } from "@/entities/action";

export function useActions(filters?: ActionFilters) {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["actions", selectedRestaurant?.id, filters],
    queryFn: () => actionRepository.getByRestaurant(selectedRestaurant!.id, filters),
    enabled: !!selectedRestaurant?.id,
  });
}

export function useMarkActionDone() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: markActionDone,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["actions"] });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        toast({
          title: "Ação concluída",
          description: "A ação foi marcada como concluída com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao concluir ação",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao concluir ação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMarkActionDiscarded() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: markActionDiscarded,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["actions"] });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        toast({
          title: "Ação descartada",
          description: "A ação foi descartada com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao descartar ação",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao descartar ação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateActionInput) => createAction(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["actions"] });
        queryClient.invalidateQueries({ queryKey: ["reports"] });
        toast({
          title: "Ação criada",
          description: "A nova ação foi criada com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao criar ação",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar ação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
