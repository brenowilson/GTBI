import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { actionRepository } from "@/shared/repositories/supabase";
import { createActionSchema } from "@/entities/action";
import type { Action, CreateActionInput } from "@/entities/action";

export async function createAction(
  input: CreateActionInput,
): Promise<Result<Action>> {
  try {
    const parsed = createActionSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0] ?? { message: "Validation failed", path: [] };
      return Result.fail(
        new ValidationError(firstError.message, firstError.path.join(".")),
      );
    }

    const action = await actionRepository.create(parsed.data);

    return Result.ok(action);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to create action"),
    );
  }
}
