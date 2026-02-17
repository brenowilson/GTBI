import { supabase } from "@/shared/lib/supabase";
import { invokeFunction } from "@/shared/lib/api";
import type { IImageJobRepository, ImageJobFilters } from "../interfaces/IImageJobRepository";
import type { ImageJob, CreateImageJobInput } from "@/entities/image-job";

export class SupabaseImageJobRepository implements IImageJobRepository {
  async getByRestaurant(restaurantId: string, filters?: ImageJobFilters): Promise<ImageJob[]> {
    let query = supabase
      .from("image_jobs")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.catalogItemId) {
      query = query.eq("catalog_item_id", filters.catalogItemId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getById(id: string): Promise<ImageJob | null> {
    const { data, error } = await supabase
      .from("image_jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async create(restaurantId: string, input: CreateImageJobInput): Promise<ImageJob> {
    const { data, error } = await invokeFunction<ImageJob>("image-generate", {
      restaurant_id: restaurantId,
      catalog_item_id: input.catalog_item_id,
      mode: input.mode,
      prompt: input.prompt,
      source_image_url: input.source_image_url,
      new_description: input.new_description,
    });

    if (error) throw new Error(error);
    return data!;
  }

  async approve(id: string): Promise<ImageJob> {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      throw new Error("User must be authenticated to approve an image job");
    }

    const { data, error } = await supabase
      .from("image_jobs")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async reject(id: string): Promise<ImageJob> {
    const { data, error } = await supabase
      .from("image_jobs")
      .update({ status: "rejected" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async applyToCatalog(id: string): Promise<void> {
    const { error } = await invokeFunction("image-apply-catalog", {
      image_job_id: id,
    });

    if (error) throw new Error(error);
  }
}
