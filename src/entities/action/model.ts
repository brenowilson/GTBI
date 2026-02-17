import { z } from "zod";

export const actionStatusSchema = z.enum(["planned", "done", "discarded"]);
export type ActionStatus = z.infer<typeof actionStatusSchema>;

export const actionTypeSchema = z.enum([
  "menu_adjustment",
  "promotion",
  "response",
  "operational",
  "marketing",
  "other",
]);
export type ActionType = z.infer<typeof actionTypeSchema>;

export const actionSchema = z.object({
  id: z.string().uuid(),
  report_id: z.string().uuid().nullable(),
  restaurant_id: z.string().uuid(),
  week_start: z.string(),
  title: z.string().min(1),
  description: z.string().nullable(),
  goal: z.string().nullable(),
  action_type: actionTypeSchema,
  payload: z.record(z.unknown()).nullable(),
  target: z.string().nullable(),
  status: actionStatusSchema.default("planned"),
  done_evidence: z.string().nullable(),
  done_by: z.string().uuid().nullable(),
  done_at: z.string().datetime().nullable(),
  discarded_reason: z.string().nullable(),
  discarded_by: z.string().uuid().nullable(),
  discarded_at: z.string().datetime().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Action = z.infer<typeof actionSchema>;

export const createActionSchema = z.object({
  restaurant_id: z.string().uuid(),
  report_id: z.string().uuid().optional(),
  week_start: z.string(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  goal: z.string().optional(),
  action_type: actionTypeSchema,
  payload: z.record(z.unknown()).optional(),
  target: z.string().optional(),
});

export type CreateActionInput = z.infer<typeof createActionSchema>;

export const markDoneSchema = z.object({
  action_id: z.string().uuid(),
  evidence: z.string().min(1),
  attachments: z.array(z.string().url()).optional(),
});

export type MarkDoneInput = z.infer<typeof markDoneSchema>;

export const markDiscardedSchema = z.object({
  action_id: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export type MarkDiscardedInput = z.infer<typeof markDiscardedSchema>;
