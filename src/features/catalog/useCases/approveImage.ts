import { Result } from "@/domain/types/Result";
import { BusinessRuleError, ValidationError } from "@/domain/errors";
import { imageJobRepository } from "@/shared/repositories/supabase";
import { ImageJobRules } from "@/entities/image-job";
import type { ImageJob } from "@/entities/image-job";

export async function approveImage(jobId: string): Promise<Result<ImageJob>> {
  try {
    if (!jobId) {
      return Result.fail(new ValidationError("Job ID is required", "jobId"));
    }

    const job = await imageJobRepository.getById(jobId);
    if (!job) {
      return Result.fail(new ValidationError("Image job not found", "jobId"));
    }

    if (!ImageJobRules.canApprove(job)) {
      return Result.fail(
        new BusinessRuleError(
          "IMAGE_CANNOT_APPROVE",
          `Image job with status "${job.status}" cannot be approved`,
        ),
      );
    }

    const updated = await imageJobRepository.approve(jobId);

    return Result.ok(updated);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to approve image"),
    );
  }
}
