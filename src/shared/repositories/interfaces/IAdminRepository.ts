export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRestaurants: number;
  activeRestaurants: number;
  totalReports: number;
  totalActions: number;
  pendingImageJobs: number;
  openTickets: number;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  channel: "email" | "whatsapp";
  recipient_user_id: string | null;
  sent_by: string;
  status: "pending" | "sent" | "failed";
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  userId?: string;
  entity?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface SendNotificationInput {
  title: string;
  body: string;
  channel: "email" | "whatsapp";
  recipientUserId?: string;
}

export interface IAdminRepository {
  getStats(): Promise<AdminStats>;
  getNotifications(filters?: { status?: string; channel?: string }): Promise<AdminNotification[]>;
  sendNotification(data: SendNotificationInput): Promise<AdminNotification>;
  getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogEntry[]>;
}
