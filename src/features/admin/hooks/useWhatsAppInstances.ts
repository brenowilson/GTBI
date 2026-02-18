import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { whatsappInstanceRepository } from "@/shared/repositories/supabase";
import { useToast } from "@/shared/hooks/use-toast";

export function useWhatsAppInstances() {
  return useQuery({
    queryKey: ["admin", "whatsapp-instances"],
    queryFn: () => whatsappInstanceRepository.getAll(),
  });
}

export function useCreateWhatsAppInstance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (name: string) => whatsappInstanceRepository.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-instances"] });
      toast({ title: "Instância criada", description: "A instância WhatsApp foi criada com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar instância", description: error.message, variant: "destructive" });
    },
  });
}

export function useConnectWhatsAppInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { instanceId: string; phone?: string }) =>
      whatsappInstanceRepository.connect(params.instanceId, params.phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-instances"] });
    },
  });
}

export function useWhatsAppInstanceStatus(instanceId: string | null) {
  return useQuery({
    queryKey: ["admin", "whatsapp-instances", "status", instanceId],
    queryFn: () => whatsappInstanceRepository.getStatus(instanceId!),
    enabled: !!instanceId,
    refetchInterval: (query) => {
      // Poll every 5 seconds while connecting, stop when connected
      const status = query.state.data?.instance?.status;
      if (status === "connecting") return 5000;
      return false;
    },
  });
}

export function useDisconnectWhatsAppInstance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (instanceId: string) => whatsappInstanceRepository.disconnect(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-instances"] });
      toast({ title: "Instância desconectada", description: "A instância WhatsApp foi desconectada." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao desconectar", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteWhatsAppInstance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (instanceId: string) => whatsappInstanceRepository.remove(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp-instances"] });
      toast({ title: "Instância removida", description: "A instância WhatsApp foi removida." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });
}
