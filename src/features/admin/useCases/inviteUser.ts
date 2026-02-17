import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { userRepository } from "@/shared/repositories/supabase";
import { createUserSchema } from "@/entities/user";
import type { CreateUserInput } from "@/entities/user";

export async function inviteUser(
  input: CreateUserInput,
): Promise<Result<void>> {
  try {
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0] ?? { message: "Validation failed", path: [] };
      return Result.fail(
        new ValidationError(firstError.message, firstError.path.join(".")),
      );
    }

    await userRepository.invite(parsed.data);

    return Result.ok(undefined);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to invite user"),
    );
  }
}
