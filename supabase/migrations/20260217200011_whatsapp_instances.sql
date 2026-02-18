-- 20260217200011_whatsapp_instances.sql
-- WhatsApp instance management table for Uazapi integration

-- ============================================
-- WHATSAPP INSTANCES
-- ============================================

CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uazapi_instance_id TEXT NOT NULL,
  instance_token TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected')),
  phone_number TEXT,
  profile_name TEXT,
  is_business BOOLEAN DEFAULT false,
  webhook_url TEXT,
  webhook_enabled BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status
  ON public.whatsapp_instances(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_created_by
  ON public.whatsapp_instances(created_by);

-- RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Only admins can manage WhatsApp instances
CREATE POLICY "Admins can manage whatsapp_instances" ON public.whatsapp_instances
  FOR ALL TO authenticated
  USING (public.user_can(auth.uid(), 'users', 'read'))
  WITH CHECK (public.user_can(auth.uid(), 'users', 'create'));

-- Updated_at trigger
CREATE TRIGGER set_whatsapp_instances_updated_at
  BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.whatsapp_instances IS 'Tracks WhatsApp instances managed via Uazapi for messaging integration';
