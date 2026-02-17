import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { financialRepository } from "@/shared/repositories/supabase";

export interface ExportFinancialDataInput {
  restaurantId: string;
  startDate: string;
  endDate: string;
  format: "csv" | "xls";
}

export async function exportFinancialData(
  input: ExportFinancialDataInput,
): Promise<Result<Blob>> {
  try {
    if (!input.restaurantId) {
      return Result.fail(new ValidationError("Restaurant ID is required", "restaurantId"));
    }
    if (!input.startDate || !input.endDate) {
      return Result.fail(new ValidationError("Date range is required", "startDate"));
    }
    if (new Date(input.startDate) > new Date(input.endDate)) {
      return Result.fail(
        new ValidationError("Start date must be before end date", "startDate"),
      );
    }

    const blob = await financialRepository.exportData(
      input.restaurantId,
      input.startDate,
      input.endDate,
      input.format,
    );

    return Result.ok(blob);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to export financial data"),
    );
  }
}
