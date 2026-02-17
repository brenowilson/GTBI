import { supabase } from "@/shared/lib/supabase";
import { invokeFunction } from "@/shared/lib/api";
import type { IReportRepository, ReportFilters } from "../interfaces/IReportRepository";
import type { Report, ReportSendLog, ReportInternalContent } from "@/entities/report";

export class SupabaseReportRepository implements IReportRepository {
  async getByRestaurant(restaurantId: string, filters?: ReportFilters): Promise<Report[]> {
    let query = supabase
      .from("reports")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("week_start", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

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

  async getById(id: string): Promise<Report | null> {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async generate(restaurantId: string, weekStart: string, weekEnd: string): Promise<Report> {
    const { data, error } = await invokeFunction<Report>("report-generate", {
      restaurant_id: restaurantId,
      week_start: weekStart,
      week_end: weekEnd,
    });

    if (error) throw new Error(error);
    return data!;
  }

  async send(reportId: string, channels: string[]): Promise<void> {
    const { error } = await invokeFunction("report-send", {
      report_id: reportId,
      channels,
    });

    if (error) throw new Error(error);
  }

  async getSendLogs(reportId: string): Promise<ReportSendLog[]> {
    const { data, error } = await supabase
      .from("report_send_logs")
      .select("*")
      .eq("report_id", reportId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getInternalContent(reportId: string): Promise<ReportInternalContent | null> {
    const { data, error } = await supabase
      .from("report_internal_content")
      .select("*")
      .eq("report_id", reportId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async upsertInternalContent(reportId: string, content: string): Promise<ReportInternalContent> {
    const existing = await this.getInternalContent(reportId);

    if (existing) {
      const { data, error } = await supabase
        .from("report_internal_content")
        .update({ content })
        .eq("report_id", reportId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const { data, error } = await supabase
      .from("report_internal_content")
      .insert({ report_id: reportId, content })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
