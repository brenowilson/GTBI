import { z } from "zod";

export const autoReplyModeSchema = z.enum(["template", "ai"]);
export type AutoReplyMode = z.infer<typeof autoReplyModeSchema>;

export const restaurantSchema = z.object({
  id: z.string().uuid(),
  ifood_account_id: z.string().uuid(),
  ifood_restaurant_id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().nullable(),
  is_active: z.boolean().default(true),
  review_auto_reply_enabled: z.boolean().default(false),
  review_auto_reply_mode: autoReplyModeSchema.default("template"),
  review_reply_template: z.string().nullable(),
  review_ai_prompt: z.string().nullable(),
  ticket_auto_reply_enabled: z.boolean().default(false),
  ticket_auto_reply_mode: autoReplyModeSchema.default("template"),
  ticket_reply_template: z.string().nullable(),
  ticket_ai_prompt: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Restaurant = z.infer<typeof restaurantSchema>;

export const restaurantSnapshotSchema = z.object({
  id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  week_start: z.string(),
  week_end: z.string(),
  visits: z.number().int().nonnegative(),
  views: z.number().int().nonnegative(),
  to_cart: z.number().int().nonnegative(),
  checkout: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  cancellation_rate: z.number().nonnegative(),
  open_time_rate: z.number().nonnegative(),
  open_tickets_rate: z.number().nonnegative(),
  new_customers_rate: z.number().nonnegative(),
  created_at: z.string().datetime(),
});

export type RestaurantSnapshot = z.infer<typeof restaurantSnapshotSchema>;
