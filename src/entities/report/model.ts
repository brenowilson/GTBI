import { z } from "zod";

export const reportStatusSchema = z.enum(["generated", "sending", "sent", "failed"]);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

export const reportSchema = z.object({
  id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  week_start: z.string(),
  week_end: z.string(),
  status: reportStatusSchema.default("generated"),
  pdf_url: z.string().nullable(),
  pdf_hash: z.string().nullable(),
  generated_at: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Report = z.infer<typeof reportSchema>;

export const reportSendLogSchema = z.object({
  id: z.string().uuid(),
  report_id: z.string().uuid(),
  sent_by: z.string().uuid(),
  channel: z.enum(["email", "whatsapp"]),
  status: z.enum(["pending", "sent", "failed"]),
  error_message: z.string().nullable(),
  sent_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});

export type ReportSendLog = z.infer<typeof reportSendLogSchema>;

export const reportInternalContentSchema = z.object({
  id: z.string().uuid(),
  report_id: z.string().uuid(),
  content: z.string(),
  updated_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ReportInternalContent = z.infer<typeof reportInternalContentSchema>;

export const sendReportSchema = z.object({
  report_id: z.string().uuid(),
  channels: z.array(z.enum(["email", "whatsapp"])).min(1),
});

export type SendReportInput = z.infer<typeof sendReportSchema>;
