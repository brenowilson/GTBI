import type { Ticket, TicketMessage } from "@/entities/ticket";

export interface TicketFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface ITicketRepository {
  getByRestaurant(restaurantId: string, filters?: TicketFilters): Promise<Ticket[]>;
  getById(id: string): Promise<Ticket | null>;
  getMessages(ticketId: string): Promise<TicketMessage[]>;
  sendMessage(ticketId: string, content: string): Promise<TicketMessage>;
  autoRespond(ticketId: string): Promise<TicketMessage>;
  updateStatus(id: string, status: string): Promise<Ticket>;
}
