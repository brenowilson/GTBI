import type { Ticket } from "./model";

export const TicketRules = {
  isOpen(ticket: Ticket): boolean {
    return ticket.status === "open" || ticket.status === "in_progress";
  },

  canReply(ticket: Ticket): boolean {
    return ticket.status !== "closed";
  },
};
