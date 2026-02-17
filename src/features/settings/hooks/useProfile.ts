import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userRepository } from "@/shared/repositories/supabase";
import { useAuthStore } from "@/stores/auth.store";
import { useToast } from "@/shared/hooks/use-toast";
import type { UserProfile } from "@/entities/user";

export function useProfile() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => userRepository.getById(user!.id),
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: (
      data: Partial<Pick<UserProfile, "full_name" | "avatar_url" | "theme_preference">>,
    ) => userRepository.update(user!.id, data),
    onSuccess: (updatedProfile) => {
      setUser(updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    profile: query.data ?? user,
    isLoading: query.isLoading,
    update: updateMutation,
  };
}
