-- 20260225110000_async_reports_api_usage.sql
-- Async report generation support + OpenAI API usage tracking

-- ============================================
-- API USAGE LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  edge_function TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  estimated_cost NUMERIC(12, 8) NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_edge_function
  ON public.api_usage_logs(edge_function);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at
  ON public.api_usage_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id
  ON public.api_usage_logs(user_id);

-- RLS: service_role only (same pattern as audit_logs and idempotency_keys)
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_usage_logs_service_role_only"
  ON public.api_usage_logs
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- ============================================
-- ALTER REPORTS STATUS CHECK — add 'generating'
-- ============================================

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_status_check
  CHECK (status IN ('generating', 'generated', 'sending', 'sent', 'failed'));

-- ============================================
-- REALTIME PUBLICATION
-- ============================================

-- Ensure reports table is published for Realtime subscriptions
-- (ignore error if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.api_usage_logs IS 'Tracks OpenAI API token usage and estimated cost per Edge Function call';
COMMENT ON COLUMN public.api_usage_logs.estimated_cost IS 'Estimated cost in USD with 8 decimal places precision';
COMMENT ON COLUMN public.api_usage_logs.metadata IS 'Additional context: step name, screenshot count, etc.';
