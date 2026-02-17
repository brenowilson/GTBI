import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { imageJobRepository } from "@/shared/repositories/supabase";
import { generateImage } from "../useCases/generateImage";
import { approveImage } from "../useCases/approveImage";
import { rejectImage } from "../useCases/rejectImage";
import { applyImageToCatalog } from "../useCases/applyImageToCatalog";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { useToast } from "@/shared/hooks/use-toast";
import type { ImageJobFilters } from "@/shared/repositories/interfaces";
import type { CreateImageJobInput } from "@/entities/image-job";

export function useImageJobs(filters?: ImageJobFilters) {
  const { selectedRestaurant } = useRestaurantStore();

  return useQuery({
    queryKey: ["image-jobs", selectedRestaurant?.id, filters],
    queryFn: () =>
      imageJobRepository.getByRestaurant(selectedRestaurant!.id, filters),
    enabled: !!selectedRestaurant?.id,
  });
}

export function useGenerateImage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { selectedRestaurant } = useRestaurantStore();

  return useMutation({
    mutationFn: (data: CreateImageJobInput) =>
      generateImage({ restaurantId: selectedRestaurant!.id, data }),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["image-jobs"] });
        toast({
          title: "Geração de imagem iniciada",
          description: "A imagem está sendo gerada. Você será notificado quando estiver pronta.",
        });
      } else {
        toast({
          title: "Erro ao gerar imagem",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao gerar imagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useApproveImage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: approveImage,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["image-jobs"] });
        toast({
          title: "Imagem aprovada",
          description: "A imagem foi aprovada e pode ser aplicada ao catálogo.",
        });
      } else {
        toast({
          title: "Erro ao aprovar imagem",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar imagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRejectImage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: rejectImage,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["image-jobs"] });
        toast({
          title: "Imagem rejeitada",
          description: "A imagem foi rejeitada.",
        });
      } else {
        toast({
          title: "Erro ao rejeitar imagem",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao rejeitar imagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useApplyImageToCatalog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: applyImageToCatalog,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["image-jobs"] });
        queryClient.invalidateQueries({ queryKey: ["catalog"] });
        toast({
          title: "Imagem aplicada",
          description: "A imagem foi aplicada ao item do catálogo com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao aplicar imagem",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aplicar imagem",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
