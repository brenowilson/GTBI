-- 20260225100000_report_screenshots.sql
-- Report screenshots for AI-based report generation

-- ============================================
-- REPORT SCREENSHOTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.report_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_data JSONB,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_screenshots_report_id
  ON public.report_screenshots(report_id);

CREATE INDEX IF NOT EXISTS idx_report_screenshots_uploaded_by
  ON public.report_screenshots(uploaded_by);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.report_screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "report_screenshots_select"
  ON public.report_screenshots
  FOR SELECT
  TO authenticated
  USING (public.user_can((select auth.uid()), 'reports', 'read'));

CREATE POLICY "report_screenshots_insert"
  ON public.report_screenshots
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'reports', 'create'));

CREATE POLICY "report_screenshots_update"
  ON public.report_screenshots
  FOR UPDATE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'reports', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'reports', 'update'));

-- ============================================
-- STORAGE BUCKET: report-screenshots
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-screenshots',
  'report-screenshots',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "report_screenshots_storage_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-screenshots'
  AND public.user_can((select auth.uid()), 'reports', 'create')
);

CREATE POLICY "report_screenshots_storage_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'report-screenshots'
  AND public.user_can((select auth.uid()), 'reports', 'read')
);

-- ============================================
-- ALTER REPORTS TABLE
-- ============================================

ALTER TABLE public.reports ALTER COLUMN restaurant_id DROP NOT NULL;

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'api' CHECK (source IN ('api', 'screenshots'));

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS ifood_account_id UUID REFERENCES public.ifood_accounts(id);

CREATE INDEX IF NOT EXISTS idx_reports_ifood_account_id
  ON public.reports(ifood_account_id);

CREATE INDEX IF NOT EXISTS idx_reports_source
  ON public.reports(source);

CREATE POLICY "reports_select_screenshots"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    source = 'screenshots'
    AND public.user_can((select auth.uid()), 'reports', 'read')
  );

CREATE POLICY "reports_insert_screenshots"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    source = 'screenshots'
    AND public.user_can((select auth.uid()), 'reports', 'create')
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.report_screenshots IS 'Screenshots uploaded for AI-based report generation';
COMMENT ON COLUMN public.reports.source IS 'How the report was generated: api (from iFood data) or screenshots (from uploaded images)';
COMMENT ON COLUMN public.reports.ifood_account_id IS 'Optional: iFood account this report belongs to (for screenshot reports without restaurant)';
