import { useQuery } from "@tanstack/react-query";
import { adminRepository } from "@/shared/repositories/supabase";
import type { AuditLogFilters } from "@/shared/repositories/interfaces";

export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ["admin", "audit-logs", filters],
    queryFn: () => adminRepository.getAuditLogs(filters),
  });
}
