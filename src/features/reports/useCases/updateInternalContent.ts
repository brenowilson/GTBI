import { Result } from "@/domain/types/Result";
import { ValidationError } from "@/domain/errors";
import { reportRepository } from "@/shared/repositories/supabase";
import type { ReportInternalContent } from "@/entities/report";

export interface UpdateInternalContentInput {
  reportId: string;
  content: string;
}

export async function updateInternalContent(
  input: UpdateInternalContentInput,
): Promise<Result<ReportInternalContent>> {
  try {
    if (!input.reportId) {
      return Result.fail(new ValidationError("Report ID is required", "reportId"));
    }
    if (!input.content.trim()) {
      return Result.fail(new ValidationError("Content cannot be empty", "content"));
    }

    const internalContent = await reportRepository.upsertInternalContent(
      input.reportId,
      input.content,
    );

    return Result.ok(internalContent);
  } catch (error) {
    return Result.fail(
      error instanceof Error ? error : new Error("Failed to update internal content"),
    );
  }
}
