import { z } from "zod";

export const ticketSchema = z.object({
  id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  ifood_ticket_id: z.string(),
  order_id: z.string().nullable(),
  subject: z.string().nullable(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Ticket = z.infer<typeof ticketSchema>;

export const ticketMessageSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string().uuid(),
  ifood_message_id: z.string().nullable(),
  sender: z.enum(["customer", "restaurant", "system"]),
  content: z.string(),
  response_mode: z.enum(["manual", "template", "ai"]).nullable(),
  response_status: z.enum(["pending", "sent", "failed"]).nullable(),
  response_error: z.string().nullable(),
  sent_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export type TicketMessage = z.infer<typeof ticketMessageSchema>;
