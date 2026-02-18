import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { ifoodAccountRepository } from "@/shared/repositories/supabase";
import { connectIfoodAccountSchema } from "@/entities/ifood-account";
import type { IfoodAccount, ConnectIfoodAccountInput } from "@/entities/ifood-account";
import type { IfoodUserCodeResponse } from "@/shared/repositories/interfaces";

export async function requestIfoodCode(): Promise<Result<IfoodUserCodeResponse>> {
  try {
    const codeResponse = await ifoodAccountRepository.requestCode();
    return Result.ok(codeResponse);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to request iFood code"),
    );
  }
}

export async function connectIfoodAccount(
  input: ConnectIfoodAccountInput & { authorization_code_verifier: string },
): Promise<Result<IfoodAccount>> {
  try {
    const parsed = connectIfoodAccountSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0] ?? { message: "Validation failed", path: [] };
      return Result.fail(
        new ValidationError(firstError.message, firstError.path.join(".")),
      );
    }

    const account = await ifoodAccountRepository.connect({
      ...parsed.data,
      authorization_code_verifier: input.authorization_code_verifier,
    });

    return Result.ok(account);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to connect iFood account"),
    );
  }
}
