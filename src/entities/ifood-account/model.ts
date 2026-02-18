import { z } from "zod";

export const ifoodAccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  merchant_id: z.string().min(1),
  is_active: z.boolean().default(true),
  token_expires_at: z.string().datetime().nullable(),
  last_sync_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type IfoodAccount = z.infer<typeof ifoodAccountSchema>;

export const ifoodAccountAccessSchema = z.object({
  id: z.string().uuid(),
  ifood_account_id: z.string().uuid(),
  user_id: z.string().uuid(),
  granted_by: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type IfoodAccountAccess = z.infer<typeof ifoodAccountAccessSchema>;

export const connectIfoodAccountSchema = z.object({
  name: z.string().min(1, "Nome da conta é obrigatório"),
  merchant_id: z.string().min(1, "Merchant ID é obrigatório"),
});

export type ConnectIfoodAccountInput = z.infer<typeof connectIfoodAccountSchema>;
