import { z } from "zod";

export const catalogItemSchema = z.object({
  id: z.string().uuid(),
  restaurant_id: z.string().uuid(),
  ifood_item_id: z.string(),
  category_id: z.string().nullable(),
  category_name: z.string().nullable(),
  name: z.string().min(1),
  description: z.string().nullable(),
  price: z.number().nonnegative(),
  image_url: z.string().nullable(),
  is_available: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type CatalogItem = z.infer<typeof catalogItemSchema>;
