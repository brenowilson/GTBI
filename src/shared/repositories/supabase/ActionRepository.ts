import { supabase } from "@/shared/lib/supabase";
import type { IActionRepository, ActionFilters } from "../interfaces/IActionRepository";
import type { Action, CreateActionInput } from "@/entities/action";

export class SupabaseActionRepository implements IActionRepository {
  async getByRestaurant(restaurantId: string, filters?: ActionFilters): Promise<Action[]> {
    let query = supabase
      .from("actions")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.actionType) {
      query = query.eq("action_type", filters.actionType);
    }

    if (filters?.weekStart) {
      query = query.eq("week_start", filters.weekStart);
    }

    if (filters?.reportId) {
      query = query.eq("report_id", filters.reportId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getById(id: string): Promise<Action | null> {
    const { data, error } = await supabase
      .from("actions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async create(input: CreateActionInput): Promise<Action> {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      throw new Error("User must be authenticated to create an action");
    }

    const { data, error } = await supabase
      .from("actions")
      .insert({
        restaurant_id: input.restaurant_id,
        report_id: input.report_id ?? null,
        week_start: input.week_start,
        title: input.title,
        description: input.description ?? null,
        goal: input.goal ?? null,
        action_type: input.action_type,
        payload: input.payload ?? null,
        target: input.target ?? null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async markDone(id: string, evidence: string): Promise<Action> {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      throw new Error("User must be authenticated to mark an action as done");
    }

    const { data, error } = await supabase
      .from("actions")
      .update({
        status: "done",
        done_evidence: evidence,
        done_by: userId,
        done_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async markDiscarded(id: string, reason: string): Promise<Action> {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      throw new Error("User must be authenticated to discard an action");
    }

    const { data, error } = await supabase
      .from("actions")
      .update({
        status: "discarded",
        discarded_reason: reason,
        discarded_by: userId,
        discarded_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
