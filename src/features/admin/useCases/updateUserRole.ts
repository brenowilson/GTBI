import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { userRepository } from "@/shared/repositories/supabase";

export interface UpdateUserRoleInput {
  userId: string;
  roleId: string;
  action: "assign" | "remove";
}

export async function updateUserRole(
  input: UpdateUserRoleInput,
): Promise<Result<void>> {
  try {
    if (!input.userId) {
      return Result.fail(new ValidationError("User ID is required", "userId"));
    }
    if (!input.roleId) {
      return Result.fail(new ValidationError("Role ID is required", "roleId"));
    }

    if (input.action === "assign") {
      await userRepository.assignRole(input.userId, input.roleId);
    } else {
      await userRepository.removeRole(input.userId, input.roleId);
    }

    return Result.ok(undefined);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to update user role"),
    );
  }
}
