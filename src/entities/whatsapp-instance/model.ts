import { z } from "zod";

export const whatsappInstanceSchema = z.object({
  id: z.string().uuid(),
  uazapi_instance_id: z.string(),
  name: z.string(),
  status: z.enum(["disconnected", "connecting", "connected"]),
  phone_number: z.string().nullable(),
  profile_name: z.string().nullable(),
  is_business: z.boolean(),
  webhook_url: z.string().nullable(),
  webhook_enabled: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type WhatsAppInstance = z.infer<typeof whatsappInstanceSchema>;

export const createWhatsAppInstanceSchema = z.object({
  name: z.string().min(1, "Nome da instância é obrigatório"),
});

export type CreateWhatsAppInstanceInput = z.infer<typeof createWhatsAppInstanceSchema>;
