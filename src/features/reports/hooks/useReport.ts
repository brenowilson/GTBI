import { useQuery } from "@tanstack/react-query";
import { reportRepository } from "@/shared/repositories/supabase";

export function useReport(reportId: string | undefined) {
  return useQuery({
    queryKey: ["reports", "detail", reportId],
    queryFn: () => reportRepository.getById(reportId!),
    enabled: !!reportId,
  });
}

export function useReportSendLogs(reportId: string | undefined) {
  return useQuery({
    queryKey: ["reports", "send-logs", reportId],
    queryFn: () => reportRepository.getSendLogs(reportId!),
    enabled: !!reportId,
  });
}
