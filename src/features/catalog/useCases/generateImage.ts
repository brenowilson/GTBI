import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { imageJobRepository } from "@/shared/repositories/supabase";
import { createImageJobSchema } from "@/entities/image-job";
import type { ImageJob, CreateImageJobInput } from "@/entities/image-job";

export interface GenerateImageInput {
  restaurantId: string;
  data: CreateImageJobInput;
}

export async function generateImage(
  input: GenerateImageInput,
): Promise<Result<ImageJob>> {
  try {
    if (!input.restaurantId) {
      return Result.fail(new ValidationError("Restaurant ID is required", "restaurantId"));
    }

    const parsed = createImageJobSchema.safeParse(input.data);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0] ?? { message: "Validation failed", path: [] };
      return Result.fail(
        new ValidationError(firstError.message, firstError.path.join(".")),
      );
    }

    const job = await imageJobRepository.create(input.restaurantId, parsed.data);

    return Result.ok(job);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to generate image"),
    );
  }
}
