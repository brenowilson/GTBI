import { z } from "zod";

export const financialEntryTypeSchema = z.enum([
  "revenue",
  "fee",
  "promotion",
  "refund",
  "adjustment",
  "delivery_fee",
  "commission",
  "other",
]);
export type FinancialEntryType = z.infer<typeof financialEntryTypeSchema>;

export const financialEntrySchema = z.object({
  id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  ifood_entry_id: z.string().nullable(),
  entry_type: financialEntryTypeSchema,
  description: z.string().nullable(),
  amount: z.number(),
  reference_date: z.string(),
  order_id: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type FinancialEntry = z.infer<typeof financialEntrySchema>;

export const financialSummarySchema = z.object({
  total_positive: z.number(),
  total_negative: z.number(),
  net: z.number(),
  breakdown: z.array(
    z.object({
      entry_type: financialEntryTypeSchema,
      total: z.number(),
      count: z.number(),
    })
  ),
});

export type FinancialSummary = z.infer<typeof financialSummarySchema>;

export const financialExportSchema = z.object({
  restaurant_id: z.string().uuid(),
  start_date: z.string(),
  end_date: z.string(),
  format: z.enum(["csv", "xls"]),
});

export type FinancialExportInput = z.infer<typeof financialExportSchema>;
