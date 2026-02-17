import { useQuery } from "@tanstack/react-query";
import { ticketRepository } from "@/shared/repositories/supabase";

export function useTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["tickets", "detail", ticketId],
    queryFn: () => ticketRepository.getById(ticketId!),
    enabled: !!ticketId,
  });
}

export function useTicketMessages(ticketId: string | undefined) {
  return useQuery({
    queryKey: ["tickets", "messages", ticketId],
    queryFn: () => ticketRepository.getMessages(ticketId!),
    enabled: !!ticketId,
  });
}
