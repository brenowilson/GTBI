import { supabase } from "@/shared/lib/supabase";
import type { ICatalogRepository, CatalogFilters, CatalogCategory } from "../interfaces/ICatalogRepository";
import type { CatalogItem } from "@/entities/catalog-item";

export class SupabaseCatalogRepository implements ICatalogRepository {
  async getItemsByRestaurant(restaurantId: string, filters?: CatalogFilters): Promise<CatalogItem[]> {
    let query = supabase
      .from("catalog_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("name", { ascending: true });

    if (filters?.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }

    if (filters?.isAvailable !== undefined) {
      query = query.eq("is_available", filters.isAvailable);
    }

    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getItemById(id: string): Promise<CatalogItem | null> {
    const { data, error } = await supabase
      .from("catalog_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async getCategoriesByRestaurant(restaurantId: string): Promise<CatalogCategory[]> {
    const { data, error } = await supabase
      .from("catalog_categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async updateItem(
    id: string,
    data: Partial<Pick<CatalogItem, "name" | "description" | "price" | "image_url" | "is_available">>,
  ): Promise<CatalogItem> {
    const { data: updated, error } = await supabase
      .from("catalog_items")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }
}
