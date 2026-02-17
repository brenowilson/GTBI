import { z } from "zod";

export const reviewSchema = z.object({
  id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  ifood_review_id: z.string(),
  order_id: z.string().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  customer_name: z.string().nullable(),
  review_date: z.string().datetime(),
  response: z.string().nullable(),
  response_sent_at: z.string().datetime().nullable(),
  response_mode: z.enum(["manual", "template", "ai"]).nullable(),
  response_status: z.enum(["pending", "sent", "failed"]).nullable(),
  response_error: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Review = z.infer<typeof reviewSchema>;
