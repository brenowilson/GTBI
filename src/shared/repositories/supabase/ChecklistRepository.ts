import { supabase } from "@/shared/lib/supabase";
import type { IChecklistRepository, ChecklistItem, ChecklistFilters } from "../interfaces/IChecklistRepository";

export class SupabaseChecklistRepository implements IChecklistRepository {
  async getByRestaurant(restaurantId: string, filters?: ChecklistFilters): Promise<ChecklistItem[]> {
    let query = supabase
      .from("checklists")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: true });

    if (filters?.reportId) {
      query = query.eq("report_id", filters.reportId);
    }

    if (filters?.weekStart) {
      query = query.eq("week_start", filters.weekStart);
    }

    if (filters?.isChecked !== undefined) {
      query = query.eq("is_checked", filters.isChecked);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getById(id: string): Promise<ChecklistItem | null> {
    const { data, error } = await supabase
      .from("checklists")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async toggleCheck(id: string, isChecked: boolean): Promise<ChecklistItem> {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    const updateData: Record<string, unknown> = {
      is_checked: isChecked,
    };

    if (isChecked) {
      updateData.checked_by = userId ?? null;
      updateData.checked_at = new Date().toISOString();
    } else {
      updateData.checked_by = null;
      updateData.checked_at = null;
    }

    const { data, error } = await supabase
      .from("checklists")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
