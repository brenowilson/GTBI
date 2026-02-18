import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ifoodAccountRepository } from "@/shared/repositories/supabase";
import { connectIfoodAccount, requestIfoodCode } from "../useCases/connectIfoodAccount";
import { useRestaurantStore } from "@/stores/restaurant.store";
import { useToast } from "@/shared/hooks/use-toast";
import type { IfoodAccountFilters } from "@/shared/repositories/interfaces";
import type { ConnectIfoodAccountInput } from "@/entities/ifood-account";

export function useIfoodAccounts(filters?: IfoodAccountFilters) {
  return useQuery({
    queryKey: ["admin", "ifood-accounts", filters],
    queryFn: () => ifoodAccountRepository.getAll(filters),
  });
}

export function useIfoodAccountAccess(accountId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "ifood-accounts", "access", accountId],
    queryFn: () => ifoodAccountRepository.getAccessList(accountId!),
    enabled: !!accountId,
  });
}

export function useRequestIfoodCode() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => requestIfoodCode(),
    onSuccess: (result) => {
      if (!result.success) {
        toast({
          title: "Erro ao solicitar código",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao solicitar código",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useConnectIfoodAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: ConnectIfoodAccountInput & { authorization_code_verifier: string }) =>
      connectIfoodAccount(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin", "ifood-accounts"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
        toast({
          title: "Conta conectada",
          description: "A conta iFood foi conectada com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao conectar conta",
          description: result.error.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao conectar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSyncIfoodRestaurants() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setAccounts } = useRestaurantStore();

  return useMutation({
    mutationFn: (accountId: string) =>
      ifoodAccountRepository.syncRestaurants(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ifood-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["restaurants"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });

      // Reload account/restaurant lists in store
      ifoodAccountRepository.getAll().then(setAccounts);

      toast({
        title: "Sincronização concluída",
        description: "Os restaurantes foram sincronizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCollectIfoodData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (input: { restaurantId: string; weekStart: string; weekEnd: string }) =>
      ifoodAccountRepository.collectData(input.restaurantId, input.weekStart, input.weekEnd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ifood-accounts"] });
      toast({
        title: "Coleta de dados iniciada",
        description: "Os dados estão sendo coletados do iFood.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na coleta de dados",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeactivateIfoodAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (accountId: string) =>
      ifoodAccountRepository.deactivate(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ifood-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({
        title: "Conta desativada",
        description: "A conta iFood foi desativada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao desativar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
