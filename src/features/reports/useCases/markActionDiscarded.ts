import { Result } from "@/domain/types/Result";
import { BusinessRuleError, ValidationError } from "@/domain/errors";
import { actionRepository } from "@/shared/repositories/supabase";
import { ActionRules } from "@/entities/action";
import type { Action } from "@/entities/action";

export interface MarkActionDiscardedInput {
  actionId: string;
  reason: string;
}

export async function markActionDiscarded(
  input: MarkActionDiscardedInput,
): Promise<Result<Action>> {
  try {
    if (!input.actionId) {
      return Result.fail(new ValidationError("Action ID is required", "actionId"));
    }
    if (!input.reason.trim()) {
      return Result.fail(new ValidationError("Reason is required to discard action", "reason"));
    }

    const action = await actionRepository.getById(input.actionId);
    if (!action) {
      return Result.fail(new ValidationError("Action not found", "actionId"));
    }

    if (!ActionRules.canDiscard(action)) {
      return Result.fail(
        new BusinessRuleError(
          "ACTION_CANNOT_DISCARD",
          `Action with status "${action.status}" cannot be discarded`,
        ),
      );
    }

    const updated = await actionRepository.markDiscarded(input.actionId, input.reason);

    return Result.ok(updated);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to discard action"),
    );
  }
}
