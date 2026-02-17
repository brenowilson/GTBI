import { Result } from "@/domain/types/Result";
import { BusinessRuleError, ValidationError } from "@/domain/errors";
import { imageJobRepository } from "@/shared/repositories/supabase";
import { ImageJobRules } from "@/entities/image-job";

export async function applyImageToCatalog(jobId: string): Promise<Result<void>> {
  try {
    if (!jobId) {
      return Result.fail(new ValidationError("Job ID is required", "jobId"));
    }

    const job = await imageJobRepository.getById(jobId);
    if (!job) {
      return Result.fail(new ValidationError("Image job not found", "jobId"));
    }

    if (!ImageJobRules.canApplyToCatalog(job)) {
      return Result.fail(
        new BusinessRuleError(
          "IMAGE_CANNOT_APPLY",
          `Image job with status "${job.status}" cannot be applied to catalog`,
        ),
      );
    }

    await imageJobRepository.applyToCatalog(jobId);

    return Result.ok(undefined);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to apply image to catalog"),
    );
  }
}
