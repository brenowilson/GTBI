import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { reviewRepository } from "@/shared/repositories/supabase";
import type { Review } from "@/entities/review";

export interface RespondToReviewInput {
  reviewId: string;
  response: string;
}

export async function respondToReview(
  input: RespondToReviewInput,
): Promise<Result<Review>> {
  try {
    if (!input.reviewId) {
      return Result.fail(new ValidationError("Review ID is required", "reviewId"));
    }
    if (!input.response.trim()) {
      return Result.fail(new ValidationError("Response text is required", "response"));
    }

    const review = await reviewRepository.respond(input.reviewId, input.response);

    return Result.ok(review);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to respond to review"),
    );
  }
}
