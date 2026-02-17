import { Result } from "@/domain/types/Result";
import { BusinessRuleError, ValidationError } from "@/domain/errors";
import { reportRepository } from "@/shared/repositories/supabase";
import { ReportRules } from "@/entities/report";

export interface SendReportInput {
  reportId: string;
  channels: string[];
}

export async function sendReport(
  input: SendReportInput,
): Promise<Result<void>> {
  try {
    if (!input.reportId) {
      return Result.fail(new ValidationError("Report ID is required", "reportId"));
    }
    if (!input.channels.length) {
      return Result.fail(new ValidationError("At least one channel is required", "channels"));
    }

    const report = await reportRepository.getById(input.reportId);
    if (!report) {
      return Result.fail(new ValidationError("Report not found", "reportId"));
    }

    if (!ReportRules.canSend(report)) {
      return Result.fail(
        new BusinessRuleError(
          "REPORT_CANNOT_SEND",
          `Report with status "${report.status}" cannot be sent`,
        ),
      );
    }

    await reportRepository.send(input.reportId, input.channels);

    return Result.ok(undefined);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to send report"),
    );
  }
}
