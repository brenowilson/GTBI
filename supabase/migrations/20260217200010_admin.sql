-- 20260217200010_admin.sql
-- Admin notifications table

-- ============================================
-- ADMIN NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  recipient_user_id UUID REFERENCES auth.users(id),
  sent_by UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_recipient_user_id
  ON public.admin_notifications(recipient_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_sent_by
  ON public.admin_notifications(sent_by);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_status
  ON public.admin_notifications(status);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_channel
  ON public.admin_notifications(channel);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at
  ON public.admin_notifications(created_at DESC);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can see admin notifications
CREATE POLICY "admin_notifications_select_admin"
  ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'read'));

-- Only admins can create admin notifications
CREATE POLICY "admin_notifications_insert_admin"
  ON public.admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'create'));

-- Only admins can update admin notifications
CREATE POLICY "admin_notifications_update_admin"
  ON public.admin_notifications
  FOR UPDATE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'update'));

-- Only admins can delete admin notifications
CREATE POLICY "admin_notifications_delete_admin"
  ON public.admin_notifications
  FOR DELETE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'delete'));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.admin_notifications IS 'Admin-sent notifications to users via email or whatsapp';
