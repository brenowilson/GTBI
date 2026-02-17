-- 20260217200001_infrastructure.sql
-- Infrastructure tables: idempotency_keys, audit_logs, rate_limit_logs
-- Helper function: log_audit()

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION (reusable)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- IDEMPOTENCY KEYS
-- ============================================

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key
  ON public.idempotency_keys(key);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at
  ON public.idempotency_keys(created_at);

-- RLS
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Only service_role can access (used by Edge Functions)
CREATE POLICY "idempotency_keys_service_role_only"
  ON public.idempotency_keys
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.idempotency_keys IS 'Tracks idempotent operations to prevent duplicate processing';

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs(entity, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs(created_at DESC);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read audit logs
CREATE POLICY "audit_logs_select_authenticated"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role can insert (via trigger or Edge Functions)
CREATE POLICY "audit_logs_insert_service_role"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail for all critical actions';

-- ============================================
-- RATE LIMIT LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  function_name TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_user_id
  ON public.rate_limit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_function_name
  ON public.rate_limit_logs(function_name, created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip_address
  ON public.rate_limit_logs(ip_address, created_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_created_at
  ON public.rate_limit_logs(created_at);

-- RLS
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- Only service_role can access (used by middleware)
CREATE POLICY "rate_limit_logs_service_role_only"
  ON public.rate_limit_logs
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.rate_limit_logs IS 'Tracks API request rates for rate limiting';

-- ============================================
-- HELPER FUNCTION: log_audit()
-- ============================================

CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_entity TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    old_data,
    new_data,
    ip_address
  ) VALUES (
    auth.uid(),
    p_action,
    p_entity,
    p_entity_id,
    p_old_data,
    p_new_data,
    p_ip_address
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_audit IS 'Inserts a record into audit_logs for tracking changes';

-- ============================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit('create', TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_audit('update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit('delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.audit_trigger IS 'Generic trigger function that logs changes to audit_logs';
