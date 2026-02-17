-- 20260217200004_invitations.sql
-- Invitations table for user onboarding via email invite

-- ============================================
-- INVITATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role_id UUID REFERENCES public.roles(id),
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_email
  ON public.invitations(email);

CREATE INDEX IF NOT EXISTS idx_invitations_token
  ON public.invitations(token);

CREATE INDEX IF NOT EXISTS idx_invitations_invited_by
  ON public.invitations(invited_by);

CREATE INDEX IF NOT EXISTS idx_invitations_role_id
  ON public.invitations(role_id);

CREATE INDEX IF NOT EXISTS idx_invitations_expires_at
  ON public.invitations(expires_at);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Users with user management permission can read invitations
CREATE POLICY "invitations_select_admin"
  ON public.invitations
  FOR SELECT
  TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'read'));

-- Users with user management permission can create invitations
CREATE POLICY "invitations_insert_admin"
  ON public.invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'create'));

-- Users with user management permission can update invitations
CREATE POLICY "invitations_update_admin"
  ON public.invitations
  FOR UPDATE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'update'));

-- Users with user management permission can delete invitations
CREATE POLICY "invitations_delete_admin"
  ON public.invitations
  FOR DELETE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'delete'));

-- ============================================
-- AUDIT TRIGGER
-- ============================================

CREATE TRIGGER audit_invitations
  AFTER INSERT OR UPDATE OR DELETE ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger();

COMMENT ON TABLE public.invitations IS 'Pending user invitations with expiration tokens';
