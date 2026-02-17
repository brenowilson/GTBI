import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { restaurantRepository } from "@/shared/repositories/supabase";
import type { Restaurant } from "@/entities/restaurant";

export interface ToggleAutoReplyInput {
  restaurantId: string;
  enabled: boolean;
}

export async function toggleAutoReply(
  input: ToggleAutoReplyInput,
): Promise<Result<Restaurant>> {
  try {
    if (!input.restaurantId) {
      return Result.fail(new ValidationError("Restaurant ID is required", "restaurantId"));
    }

    const restaurant = await restaurantRepository.updateSettings(input.restaurantId, {
      review_auto_reply_enabled: input.enabled,
    });

    return Result.ok(restaurant);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to toggle auto-reply"),
    );
  }
}
