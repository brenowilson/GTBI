import { Result } from "@/domain/types/Result";
import { BusinessRuleError, ValidationError } from "@/domain/errors";
import { actionRepository } from "@/shared/repositories/supabase";
import { ActionRules } from "@/entities/action";
import type { Action } from "@/entities/action";

export interface MarkActionDoneInput {
  actionId: string;
  evidence: string;
}

export async function markActionDone(
  input: MarkActionDoneInput,
): Promise<Result<Action>> {
  try {
    if (!input.actionId) {
      return Result.fail(new ValidationError("Action ID is required", "actionId"));
    }
    if (!input.evidence.trim()) {
      return Result.fail(new ValidationError("Evidence is required to mark action as done", "evidence"));
    }

    const action = await actionRepository.getById(input.actionId);
    if (!action) {
      return Result.fail(new ValidationError("Action not found", "actionId"));
    }

    if (!ActionRules.canMarkDone(action)) {
      return Result.fail(
        new BusinessRuleError(
          "ACTION_CANNOT_MARK_DONE",
          `Action with status "${action.status}" cannot be marked as done`,
        ),
      );
    }

    const updated = await actionRepository.markDone(input.actionId, input.evidence);

    return Result.ok(updated);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to mark action as done"),
    );
  }
}
