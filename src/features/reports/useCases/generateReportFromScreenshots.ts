import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { reportRepository } from "@/shared/repositories/supabase";
import { generateFromScreenshotsInputSchema } from "@/entities/report";
import type { Report, GenerateFromScreenshotsInput } from "@/entities/report";

export async function generateReportFromScreenshots(
  input: GenerateFromScreenshotsInput,
): Promise<Result<Report>> {
  try {
    const parsed = generateFromScreenshotsInputSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0] ?? {
        message: "Validation failed",
        path: [],
      };
      return Result.fail(
        new ValidationError(firstError.message, firstError.path.join(".")),
      );
    }

    const report = await reportRepository.generateFromScreenshots(parsed.data);
    return Result.ok(report);
  } catch (error) {
    return Result.fail(
      error instanceof Error
        ? error
        : new Error("Failed to generate report from screenshots"),
    );
  }
}
