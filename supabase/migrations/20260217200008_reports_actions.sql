-- 20260217200008_reports_actions.sql
-- Reports, report_send_logs, report_internal_content, actions, checklists

-- ============================================
-- REPORTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sending', 'sent', 'failed')),
  pdf_url TEXT,
  pdf_hash TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (restaurant_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_reports_restaurant_id
  ON public.reports(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_reports_week_start
  ON public.reports(week_start);

CREATE INDEX IF NOT EXISTS idx_reports_status
  ON public.reports(status);

CREATE INDEX IF NOT EXISTS idx_reports_restaurant_week
  ON public.reports(restaurant_id, week_start);

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- REPORT SEND LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.report_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  sent_by UUID REFERENCES auth.users(id),
  channel TEXT CHECK (channel IN ('email', 'whatsapp')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_send_logs_report_id
  ON public.report_send_logs(report_id);

CREATE INDEX IF NOT EXISTS idx_report_send_logs_status
  ON public.report_send_logs(status);

CREATE INDEX IF NOT EXISTS idx_report_send_logs_channel
  ON public.report_send_logs(channel);

-- ============================================
-- REPORT INTERNAL CONTENT
-- ============================================

CREATE TABLE IF NOT EXISTS public.report_internal_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_internal_content_report_id
  ON public.report_internal_content(report_id);

CREATE TRIGGER report_internal_content_updated_at
  BEFORE UPDATE ON public.report_internal_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- ACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('menu_adjustment', 'promotion', 'response', 'operational', 'marketing', 'other')),
  payload JSONB,
  target TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'discarded')),
  done_evidence TEXT,
  done_by UUID REFERENCES auth.users(id),
  done_at TIMESTAMPTZ,
  discarded_reason TEXT,
  discarded_by UUID REFERENCES auth.users(id),
  discarded_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_actions_report_id
  ON public.actions(report_id);

CREATE INDEX IF NOT EXISTS idx_actions_restaurant_id
  ON public.actions(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_actions_week_start
  ON public.actions(week_start);

CREATE INDEX IF NOT EXISTS idx_actions_status
  ON public.actions(status);

CREATE INDEX IF NOT EXISTS idx_actions_action_type
  ON public.actions(action_type);

CREATE INDEX IF NOT EXISTS idx_actions_restaurant_week
  ON public.actions(restaurant_id, week_start);

CREATE TRIGGER actions_updated_at
  BEFORE UPDATE ON public.actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- CHECKLISTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  week_start DATE,
  title TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT false,
  checked_by UUID REFERENCES auth.users(id),
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checklists_report_id
  ON public.checklists(report_id);

CREATE INDEX IF NOT EXISTS idx_checklists_restaurant_id
  ON public.checklists(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_checklists_week_start
  ON public.checklists(week_start);

-- ============================================
-- RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_send_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_internal_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: reports
-- ============================================

CREATE POLICY "reports_select_own"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "reports_insert_admin"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'reports', 'create'));

CREATE POLICY "reports_update_own"
  ON public.reports
  FOR UPDATE
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id))
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

-- ============================================
-- RLS POLICIES: report_send_logs
-- ============================================

CREATE POLICY "report_send_logs_select_own"
  ON public.report_send_logs
  FOR SELECT
  TO authenticated
  USING (
    report_id IN (
      SELECT id FROM public.reports
      WHERE public.user_has_restaurant_access((select auth.uid()), restaurant_id)
    )
  );

CREATE POLICY "report_send_logs_insert_own"
  ON public.report_send_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    report_id IN (
      SELECT id FROM public.reports
      WHERE public.user_has_restaurant_access((select auth.uid()), restaurant_id)
    )
  );

-- ============================================
-- RLS POLICIES: report_internal_content
-- ============================================

CREATE POLICY "report_internal_content_select_own"
  ON public.report_internal_content
  FOR SELECT
  TO authenticated
  USING (
    report_id IN (
      SELECT id FROM public.reports
      WHERE public.user_has_restaurant_access((select auth.uid()), restaurant_id)
    )
  );

CREATE POLICY "report_internal_content_insert_own"
  ON public.report_internal_content
  FOR INSERT
  TO authenticated
  WITH CHECK (
    report_id IN (
      SELECT id FROM public.reports
      WHERE public.user_has_restaurant_access((select auth.uid()), restaurant_id)
    )
  );

CREATE POLICY "report_internal_content_update_own"
  ON public.report_internal_content
  FOR UPDATE
  TO authenticated
  USING (
    report_id IN (
      SELECT id FROM public.reports
      WHERE public.user_has_restaurant_access((select auth.uid()), restaurant_id)
    )
  )
  WITH CHECK (
    report_id IN (
      SELECT id FROM public.reports
      WHERE public.user_has_restaurant_access((select auth.uid()), restaurant_id)
    )
  );

-- ============================================
-- RLS POLICIES: actions
-- ============================================

CREATE POLICY "actions_select_own"
  ON public.actions
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "actions_insert_own"
  ON public.actions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "actions_update_own"
  ON public.actions
  FOR UPDATE
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id))
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

-- ============================================
-- RLS POLICIES: checklists
-- ============================================

CREATE POLICY "checklists_select_own"
  ON public.checklists
  FOR SELECT
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "checklists_insert_own"
  ON public.checklists
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

CREATE POLICY "checklists_update_own"
  ON public.checklists
  FOR UPDATE
  TO authenticated
  USING (public.user_has_restaurant_access((select auth.uid()), restaurant_id))
  WITH CHECK (public.user_has_restaurant_access((select auth.uid()), restaurant_id));

-- ============================================
-- AUDIT TRIGGERS
-- ============================================

CREATE TRIGGER audit_reports
  AFTER INSERT OR UPDATE OR DELETE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_actions
  AFTER INSERT OR UPDATE OR DELETE ON public.actions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.reports IS 'Weekly BI reports with PDF generation and delivery tracking';
COMMENT ON TABLE public.report_send_logs IS 'Log of report delivery attempts via email/whatsapp';
COMMENT ON TABLE public.report_internal_content IS 'Internal analysis content for reports (not sent to clients)';
COMMENT ON TABLE public.actions IS 'Recommended actions from reports with status tracking';
COMMENT ON TABLE public.checklists IS 'Weekly checklist items tied to reports';
