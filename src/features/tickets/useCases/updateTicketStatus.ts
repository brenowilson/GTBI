import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { ticketRepository } from "@/shared/repositories/supabase";
import type { Ticket } from "@/entities/ticket";

export interface UpdateTicketStatusInput {
  ticketId: string;
  status: string;
}

export async function updateTicketStatus(
  input: UpdateTicketStatusInput,
): Promise<Result<Ticket>> {
  try {
    if (!input.ticketId) {
      return Result.fail(new ValidationError("Ticket ID is required", "ticketId"));
    }
    if (!input.status) {
      return Result.fail(new ValidationError("Status is required", "status"));
    }

    const ticket = await ticketRepository.updateStatus(input.ticketId, input.status);

    return Result.ok(ticket);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to update ticket status"),
    );
  }
}
