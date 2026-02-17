import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { restaurantRepository } from "@/shared/repositories/supabase";
import type { Restaurant, AutoReplyMode } from "@/entities/restaurant";

export interface ToggleTicketAutoReplyInput {
  restaurantId: string;
  enabled: boolean;
}

export interface UpdateTicketAutoReplySettingsInput {
  restaurantId: string;
  mode?: AutoReplyMode;
  template?: string | null;
  aiPrompt?: string | null;
}

export async function toggleTicketAutoReply(
  input: ToggleTicketAutoReplyInput,
): Promise<Result<Restaurant>> {
  try {
    if (!input.restaurantId) {
      return Result.fail(new ValidationError("Restaurant ID is required", "restaurantId"));
    }

    const restaurant = await restaurantRepository.updateSettings(input.restaurantId, {
      ticket_auto_reply_enabled: input.enabled,
    });

    return Result.ok(restaurant);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to toggle ticket auto-reply"),
    );
  }
}

export async function updateTicketAutoReplySettings(
  input: UpdateTicketAutoReplySettingsInput,
): Promise<Result<Restaurant>> {
  try {
    if (!input.restaurantId) {
      return Result.fail(new ValidationError("Restaurant ID is required", "restaurantId"));
    }

    const restaurant = await restaurantRepository.updateSettings(input.restaurantId, {
      ...(input.mode !== undefined && { ticket_auto_reply_mode: input.mode }),
      ...(input.template !== undefined && { ticket_reply_template: input.template }),
      ...(input.aiPrompt !== undefined && { ticket_ai_prompt: input.aiPrompt }),
    });

    return Result.ok(restaurant);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to update ticket auto-reply settings"),
    );
  }
}
