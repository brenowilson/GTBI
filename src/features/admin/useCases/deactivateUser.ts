import { Result } from "@/domain/types/Result";
import { BusinessRuleError, ValidationError } from "@/domain/errors";
import { userRepository } from "@/shared/repositories/supabase";
import { UserRules } from "@/entities/user";
import type { UserProfile } from "@/entities/user";

export interface DeactivateUserInput {
  currentUser: UserProfile;
  targetUserId: string;
}

export async function deactivateUser(
  input: DeactivateUserInput,
): Promise<Result<void>> {
  try {
    if (!input.targetUserId) {
      return Result.fail(new ValidationError("Target user ID is required", "targetUserId"));
    }

    const targetUser = await userRepository.getById(input.targetUserId);
    if (!targetUser) {
      return Result.fail(new ValidationError("User not found", "targetUserId"));
    }

    if (!UserRules.canDeactivate(input.currentUser, targetUser)) {
      return Result.fail(
        new BusinessRuleError(
          "CANNOT_DEACTIVATE_USER",
          "You cannot deactivate this user",
        ),
      );
    }

    await userRepository.deactivate(input.targetUserId);

    return Result.ok(undefined);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to deactivate user"),
    );
  }
}
