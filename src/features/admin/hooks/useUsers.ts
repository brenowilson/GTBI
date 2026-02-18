import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userRepository } from "@/shared/repositories/supabase";
import { inviteUser } from "../useCases/inviteUser";
import { updateUserRole } from "../useCases/updateUserRole";
import { deactivateUser } from "../useCases/deactivateUser";
import { useAuthStore } from "@/stores/auth.store";
import { useToast } from "@/shared/hooks/use-toast";
import type { UserFilters } from "@/shared/repositories/interfaces";
import type { CreateUserInput } from "@/entities/user";
import type { UpdateUserRoleInput } from "../useCases/updateUserRole";

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => userRepository.getAll(filters),
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => userRepository.getRoles(),
  });
}

export function useUserRoleAssignments() {
  return useQuery({
    queryKey: ["admin", "user-role-assignments"],
    queryFn: () => userRepository.getRoleAssignments(),
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: CreateUserInput) => inviteUser(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
        toast({
          title: "Convite enviado",
          description: "O convite foi enviado para o e-mail informado.",
        });
      } else {
        toast({
          title: "Erro ao enviar convite",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: UpdateUserRoleInput) => updateUserRole(input),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "user-role-assignments"] });
        toast({
          title: variables.action === "assign" ? "Perfil atribuido" : "Perfil removido",
          description:
            variables.action === "assign"
              ? "O perfil foi atribuido ao usuario com sucesso."
              : "O perfil foi removido do usuario com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao alterar perfil",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (targetUserId: string) =>
      deactivateUser({ currentUser: user!, targetUserId }),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
        toast({
          title: "Usuário desativado",
          description: "O usuário foi desativado com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao desativar usuário",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao desativar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userId: string) => userRepository.reactivate(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({
        title: "Usuário reativado",
        description: "O usuário foi reativado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reativar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: ["admin", "role-permissions"],
    queryFn: () => userRepository.getRolePermissions(),
  });
}

export function useFeatures() {
  return useQuery({
    queryKey: ["admin", "features"],
    queryFn: () => userRepository.getFeatures(),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { name: string; description: string }) =>
      userRepository.createRole(input.name, input.description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast({ title: "Perfil criado", description: "O perfil de acesso foi criado com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar perfil", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (roleId: string) => userRepository.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "role-permissions"] });
      toast({ title: "Perfil removido", description: "O perfil de acesso foi removido com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover perfil", description: error.message, variant: "destructive" });
    },
  });
}

export function useTogglePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { roleId: string; featureCode: string; action: string; granted: boolean }) =>
      input.granted
        ? userRepository.grantPermission(input.roleId, input.featureCode, input.action)
        : userRepository.revokePermission(input.roleId, input.featureCode, input.action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "role-permissions"] });
    },
  });
}
