import { z } from "zod";

export const userRoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  is_system: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserRole = z.infer<typeof userRoleSchema>;

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1),
  avatar_url: z.string().url().nullable(),
  is_active: z.boolean().default(true),
  theme_preference: z.enum(["light", "dark", "system"]).default("light"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const userWithRoleSchema = userProfileSchema.extend({
  roles: z.array(userRoleSchema),
});

export type UserWithRole = z.infer<typeof userWithRoleSchema>;

export const createUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1).max(255),
  role_id: z.string().uuid(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
