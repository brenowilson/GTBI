import type {
  Report,
  ReportSendLog,
  ReportInternalContent,
  ReportStatus,
  ReportScreenshot,
  GenerateFromScreenshotsInput,
} from "@/entities/report";

export interface ReportFilters {
  status?: ReportStatus;
  weekStart?: string;
  weekEnd?: string;
}

export interface IReportRepository {
  getByRestaurant(restaurantId: string, filters?: ReportFilters): Promise<Report[]>;
  getAllReports(filters?: ReportFilters): Promise<Report[]>;
  getById(id: string): Promise<Report | null>;
  generate(restaurantId: string, weekStart: string, weekEnd: string): Promise<Report>;
  send(reportId: string, channels: string[]): Promise<void>;
  getSendLogs(reportId: string): Promise<ReportSendLog[]>;
  getInternalContent(reportId: string): Promise<ReportInternalContent | null>;
  upsertInternalContent(reportId: string, content: string): Promise<ReportInternalContent>;
  uploadScreenshot(file: File): Promise<{ path: string; screenshot: ReportScreenshot }>;
  generateFromScreenshots(input: GenerateFromScreenshotsInput): Promise<Report>;
  getScreenshots(reportId: string): Promise<ReportScreenshot[]>;
}
