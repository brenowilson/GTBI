import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { reportRepository } from "@/shared/repositories/supabase";
import type { Report } from "@/entities/report";

export interface GenerateReportInput {
  restaurantId: string;
  weekStart: string;
  weekEnd: string;
}

export async function generateReport(
  input: GenerateReportInput,
): Promise<Result<Report>> {
  try {
    if (!input.restaurantId) {
      return Result.fail(new ValidationError("Restaurant ID is required", "restaurantId"));
    }
    if (!input.weekStart || !input.weekEnd) {
      return Result.fail(new ValidationError("Week start and end dates are required", "weekStart"));
    }

    const report = await reportRepository.generate(
      input.restaurantId,
      input.weekStart,
      input.weekEnd,
    );

    return Result.ok(report);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to generate report"),
    );
  }
}
