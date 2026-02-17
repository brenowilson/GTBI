import { supabase } from "@/shared/lib/supabase";
import { invokeFunction } from "@/shared/lib/api";
import type { IReviewRepository, ReviewFilters } from "../interfaces/IReviewRepository";
import type { Review } from "@/entities/review";

export class SupabaseReviewRepository implements IReviewRepository {
  async getByRestaurant(restaurantId: string, filters?: ReviewFilters): Promise<Review[]> {
    let query = supabase
      .from("reviews")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("review_date", { ascending: false });

    if (filters?.rating !== undefined) {
      query = query.eq("rating", filters.rating);
    }

    if (filters?.responseStatus) {
      query = query.eq("response_status", filters.responseStatus);
    }

    if (filters?.startDate) {
      query = query.gte("review_date", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("review_date", filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getById(id: string): Promise<Review | null> {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async respond(reviewId: string, response: string): Promise<Review> {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        response,
        response_mode: "manual",
        response_status: "pending",
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async autoRespond(reviewId: string): Promise<Review> {
    const { data, error } = await invokeFunction<Review>("review-auto-respond", {
      review_id: reviewId,
    });

    if (error) throw new Error(error);
    return data!;
  }
}
