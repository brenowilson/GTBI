import { supabase } from "@/shared/lib/supabase";
import type { IRestaurantRepository, RestaurantFilters, RestaurantSettingsUpdate } from "../interfaces/IRestaurantRepository";
import type { Restaurant, RestaurantSnapshot } from "@/entities/restaurant";

export class SupabaseRestaurantRepository implements IRestaurantRepository {
  async getAll(filters?: RestaurantFilters): Promise<Restaurant[]> {
    let query = supabase
      .from("restaurants")
      .select("*")
      .order("name", { ascending: true });

    if (filters?.ifoodAccountId) {
      query = query.eq("ifood_account_id", filters.ifoodAccountId);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getById(id: string): Promise<Restaurant | null> {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateSettings(id: string, data: RestaurantSettingsUpdate): Promise<Restaurant> {
    const { data: updated, error } = await supabase
      .from("restaurants")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  async getSnapshots(
    restaurantId: string,
    filters?: { weekStart?: string; weekEnd?: string },
  ): Promise<RestaurantSnapshot[]> {
    let query = supabase
      .from("restaurant_snapshots")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("week_start", { ascending: false });

    if (filters?.weekStart) {
      query = query.gte("week_start", filters.weekStart);
    }

    if (filters?.weekEnd) {
      query = query.lte("week_end", filters.weekEnd);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getLatestSnapshot(restaurantId: string): Promise<RestaurantSnapshot | null> {
    const { data, error } = await supabase
      .from("restaurant_snapshots")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }
}
