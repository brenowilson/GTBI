import type { Review } from "./model";

export const ReviewRules = {
  isPositive(review: Review): boolean {
    return review.rating >= 4;
  },

  isNegative(review: Review): boolean {
    return review.rating <= 2;
  },

  hasResponse(review: Review): boolean {
    return review.response !== null && review.response_sent_at !== null;
  },

  needsResponse(review: Review): boolean {
    return review.response === null;
  },
};
