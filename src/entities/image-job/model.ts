import { z } from "zod";

export const imageJobModeSchema = z.enum([
  "improve_existing",
  "from_image",
  "from_description",
  "from_new_description",
  "direct_upload",
]);
export type ImageJobMode = z.infer<typeof imageJobModeSchema>;

export const imageJobStatusSchema = z.enum([
  "generating",
  "ready_for_approval",
  "approved",
  "applied_to_catalog",
  "rejected",
  "archived",
  "failed",
]);
export type ImageJobStatus = z.infer<typeof imageJobStatusSchema>;

export const imageJobSchema = z.object({
  id: z.string().uuid(),
  catalog_item_id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  mode: imageJobModeSchema,
  status: imageJobStatusSchema.default("generating"),
  prompt: z.string().nullable(),
  source_image_url: z.string().nullable(),
  generated_image_url: z.string().nullable(),
  new_description: z.string().nullable(),
  created_by: z.string().uuid(),
  approved_by: z.string().uuid().nullable(),
  approved_at: z.string().datetime().nullable(),
  applied_at: z.string().datetime().nullable(),
  error_message: z.string().nullable(),
  retry_count: z.number().int().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ImageJob = z.infer<typeof imageJobSchema>;

export const createImageJobSchema = z.object({
  catalog_item_id: z.string().uuid(),
  mode: imageJobModeSchema,
  prompt: z.string().optional(),
  source_image_url: z.string().url().optional(),
  new_description: z.string().optional(),
});

export type CreateImageJobInput = z.infer<typeof createImageJobSchema>;
