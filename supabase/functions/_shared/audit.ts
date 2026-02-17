import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuditLogEntry {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Logs an audit entry using the admin client (bypasses RLS).
 * The audit_logs table only allows inserts from service_role.
 */
export async function logAudit(
  adminClient: SupabaseClient,
  entry: AuditLogEntry,
): Promise<void> {
  const { error } = await adminClient.from("audit_logs").insert({
    user_id: entry.userId,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    old_data: entry.oldData ?? null,
    new_data: entry.newData ?? null,
    ip_address: entry.ipAddress ?? null,
  });

  if (error) {
    // Audit logging should not break the main flow — log and continue
    console.error("Failed to write audit log:", error.message);
  }
}

/**
 * Extracts the client IP from the request (X-Forwarded-For or connection info).
 */
export function getClientIp(req: Request): string | undefined {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined
  );
}
