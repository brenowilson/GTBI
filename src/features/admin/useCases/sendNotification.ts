import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { adminRepository } from "@/shared/repositories/supabase";
import type { AdminNotification, SendNotificationInput } from "@/shared/repositories/interfaces";

export async function sendNotification(
  input: SendNotificationInput,
): Promise<Result<AdminNotification>> {
  try {
    if (!input.title.trim()) {
      return Result.fail(new ValidationError("Notification title is required", "title"));
    }
    if (!input.body.trim()) {
      return Result.fail(new ValidationError("Notification body is required", "body"));
    }

    const notification = await adminRepository.sendNotification(input);

    return Result.ok(notification);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to send notification"),
    );
  }
}
