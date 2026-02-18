import { supabase } from "@/shared/lib/supabase";
import { invokeFunction } from "@/shared/lib/api";
import type {
  IAdminRepository,
  AdminStats,
  AdminNotification,
  AuditLogEntry,
  AuditLogFilters,
  SendNotificationInput,
} from "../interfaces/IAdminRepository";

export class SupabaseAdminRepository implements IAdminRepository {
  async getStats(): Promise<AdminStats> {
    const { data, error } = await invokeFunction<{
      stats: Record<string, number>;
    }>("admin-stats", undefined, {
      method: "GET",
    });

    if (error) throw new Error(error);

    const s = data!.stats;
    return {
      totalUsers: s.total_users ?? 0,
      activeUsers: s.active_users ?? 0,
      totalRestaurants: s.total_restaurants ?? 0,
      activeRestaurants: s.total_ifood_accounts ?? 0,
      totalReports: s.total_reports ?? 0,
      totalActions: s.recent_image_jobs ?? 0,
      pendingImageJobs: s.recent_image_jobs ?? 0,
      openTickets: s.open_tickets ?? 0,
    };
  }

  async getNotifications(filters?: { status?: string; channel?: string }): Promise<AdminNotification[]> {
    let query = supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.channel) {
      query = query.eq("channel", filters.channel);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async sendNotification(input: SendNotificationInput): Promise<AdminNotification> {
    const { data, error } = await invokeFunction<AdminNotification>("admin-send-notification", {
      title: input.title,
      body: input.body,
      channel: input.channel,
      recipient_user_id: input.recipientUserId,
    });

    if (error) throw new Error(error);
    return data!;
  }

  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogEntry[]> {
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (filters?.entity) {
      query = query.eq("entity", filters.entity);
    }

    if (filters?.action) {
      query = query.eq("action", filters.action);
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  }
}
