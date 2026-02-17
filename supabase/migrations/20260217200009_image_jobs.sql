-- 20260217200009_image_jobs.sql
-- AI image generation jobs for catalog items: image_jobs, image_job_logs

-- ============================================
-- IMAGE JOBS
-- ============================================

CREATE TABLE IF NOT EXISTS public.image_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID REFERENCES public.catalog_items(id),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('improve_existing', 'from_image', 'from_description', 'from_new_description', 'direct_upload')),
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'ready_for_approval', 'approved', 'applied_to_catalog', 'rejected', 'archived', 'failed')),
  prompt TEXT,
  source_image_url TEXT,
  generated_image_url TEXT,
  new_description TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_image_jobs_catalog_item_id
  ON public.image_jobs(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_image_jobs_restaurant_id
  ON public.image_jobs(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_image_jobs_status
  ON public.image_jobs(status);

CREATE INDEX IF NOT EXISTS idx_image_jobs_mode
  ON public.image_jobs(mode);

CREATE INDEX IF NOT EXISTS idx_image_jobs_created_by
  ON public.image_jobs(created_by);

CREATE INDEX IF NOT EXISTS idx_image_jobs_created_at
  ON public.image_jobs(created_at DESC);

CREATE TRIGGER image_jobs_updated_at
  BEFORE UPDATE ON public.image_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- IMAGE JOB LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.image_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_job_id UUID REFERENCES public.image_jobs(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_image_job_logs_image_job_id
  ON public.image_job_logs(image_job_id);

CREATE INDEX IF NOT EXISTS idx_image_job_logs_action
  ON public.image_job_logs(action);

CREATE INDEX IF NOT EXISTS idx_image_job_logs_performed_by
  ON public.image_job_logs(performed_by);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.image_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_job_logs ENABLE ROW LEVEL SECURITY;

-- image_jobs: users can see jobs for their restaurants
CREATE POLICY "image_jobs_select_own"
  ON public.image_jobs
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

-- image_jobs: users with restaurant access can create jobs
CREATE POLICY "image_jobs_insert_own"
  ON public.image_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

-- image_jobs: users with restaurant access can update jobs
CREATE POLICY "image_jobs_update_own"
  ON public.image_jobs
  FOR UPDATE
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id))
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

-- image_job_logs: users can see logs for their restaurant's jobs
CREATE POLICY "image_job_logs_select_own"
  ON public.image_job_logs
  FOR SELECT
  TO authenticated
  USING (
    image_job_id IN (
      SELECT id FROM public.image_jobs
      WHERE public.user_has_restaurant_access((select auth.uid()), restaurant_id)
    )
  );

-- image_job_logs: users can insert logs for their restaurant's jobs
CREATE POLICY "image_job_logs_insert_own"
  ON public.image_job_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    image_job_id IN (
      SELECT id FROM public.image_jobs
      WHERE public.user_has_restaurant_access((select auth.uid()), restaurant_id)
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.image_jobs IS 'AI-powered image generation and improvement jobs for catalog items';
COMMENT ON TABLE public.image_job_logs IS 'Audit log of actions taken on image jobs';
