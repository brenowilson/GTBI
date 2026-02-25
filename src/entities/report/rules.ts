import type { Report, ReportStatus } from "./model";

const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  generating: ["generated", "failed"],
  generated: ["sending"],
  sending: ["sent", "failed"],
  sent: [],
  failed: ["sending"],
};

export const ReportRules = {
  canTransitionTo(report: Report, newStatus: ReportStatus): boolean {
    const allowed = VALID_TRANSITIONS[report.status];
    return allowed?.includes(newStatus) ?? false;
  },

  canRetry(report: Report): boolean {
    return report.status === "failed";
  },

  canSend(report: Report): boolean {
    return report.status === "generated" || report.status === "failed";
  },
};
