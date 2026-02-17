import { Result } from "@/domain/types/Result";
import { BusinessRuleError, ValidationError } from "@/domain/errors";
import { ticketRepository } from "@/shared/repositories/supabase";
import { TicketRules } from "@/entities/ticket";
import type { TicketMessage } from "@/entities/ticket";

export interface SendTicketMessageInput {
  ticketId: string;
  content: string;
}

export async function sendTicketMessage(
  input: SendTicketMessageInput,
): Promise<Result<TicketMessage>> {
  try {
    if (!input.ticketId) {
      return Result.fail(new ValidationError("Ticket ID is required", "ticketId"));
    }
    if (!input.content.trim()) {
      return Result.fail(new ValidationError("Message content is required", "content"));
    }

    const ticket = await ticketRepository.getById(input.ticketId);
    if (!ticket) {
      return Result.fail(new ValidationError("Ticket not found", "ticketId"));
    }

    if (!TicketRules.canReply(ticket)) {
      return Result.fail(
        new BusinessRuleError(
          "TICKET_CANNOT_REPLY",
          "Cannot reply to a closed ticket",
        ),
      );
    }

    const message = await ticketRepository.sendMessage(input.ticketId, input.content);

    return Result.ok(message);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to send ticket message"),
    );
  }
}
