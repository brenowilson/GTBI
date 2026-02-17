import type { Review } from "@/entities/review";

export interface ReviewFilters {
  rating?: number;
  responseStatus?: string;
  startDate?: string;
  endDate?: string;
}

export interface IReviewRepository {
  getByRestaurant(restaurantId: string, filters?: ReviewFilters): Promise<Review[]>;
  getById(id: string): Promise<Review | null>;
  respond(reviewId: string, response: string): Promise<Review>;
  autoRespond(reviewId: string): Promise<Review>;
}
