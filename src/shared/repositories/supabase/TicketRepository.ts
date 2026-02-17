import { supabase } from "@/shared/lib/supabase";
import { invokeFunction } from "@/shared/lib/api";
import type { ITicketRepository, TicketFilters } from "../interfaces/ITicketRepository";
import type { Ticket, TicketMessage } from "@/entities/ticket";

export class SupabaseTicketRepository implements ITicketRepository {
  async getByRestaurant(restaurantId: string, filters?: TicketFilters): Promise<Ticket[]> {
    let query = supabase
      .from("tickets")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getById(id: string): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async getMessages(ticketId: string): Promise<TicketMessage[]> {
    const { data, error } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async sendMessage(ticketId: string, content: string): Promise<TicketMessage> {
    const { data, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender: "restaurant",
        content,
        response_mode: "manual",
        response_status: "pending",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async autoRespond(ticketId: string): Promise<TicketMessage> {
    const { data, error } = await invokeFunction<TicketMessage>("ticket-auto-respond", {
      ticket_id: ticketId,
    });

    if (error) throw new Error(error);
    return data!;
  }

  async updateStatus(id: string, status: string): Promise<Ticket> {
    const { data, error } = await supabase
      .from("tickets")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
