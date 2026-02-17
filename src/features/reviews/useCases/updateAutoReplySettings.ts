import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { restaurantRepository } from "@/shared/repositories/supabase";
import type { Restaurant, AutoReplyMode } from "@/entities/restaurant";

export interface UpdateAutoReplySettingsInput {
  restaurantId: string;
  mode?: AutoReplyMode;
  template?: string | null;
  aiPrompt?: string | null;
}

export async function updateAutoReplySettings(
  input: UpdateAutoReplySettingsInput,
): Promise<Result<Restaurant>> {
  try {
    if (!input.restaurantId) {
      return Result.fail(new ValidationError("Restaurant ID is required", "restaurantId"));
    }

    const restaurant = await restaurantRepository.updateSettings(input.restaurantId, {
      ...(input.mode !== undefined && { review_auto_reply_mode: input.mode }),
      ...(input.template !== undefined && { review_reply_template: input.template }),
      ...(input.aiPrompt !== undefined && { review_ai_prompt: input.aiPrompt }),
    });

    return Result.ok(restaurant);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to update auto-reply settings"),
    );
  }
}
