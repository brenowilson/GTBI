-- 20260217200005_ifood_accounts.sql
-- iFood account management: ifood_accounts, ifood_account_access

-- ============================================
-- IFOOD ACCOUNTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.ifood_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  merchant_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ifood_accounts_merchant_id
  ON public.ifood_accounts(merchant_id);

CREATE INDEX IF NOT EXISTS idx_ifood_accounts_is_active
  ON public.ifood_accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_ifood_accounts_created_by
  ON public.ifood_accounts(created_by);

CREATE TRIGGER ifood_accounts_updated_at
  BEFORE UPDATE ON public.ifood_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- IFOOD ACCOUNT ACCESS (junction table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.ifood_account_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ifood_account_id UUID REFERENCES public.ifood_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (ifood_account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ifood_account_access_ifood_account_id
  ON public.ifood_account_access(ifood_account_id);

CREATE INDEX IF NOT EXISTS idx_ifood_account_access_user_id
  ON public.ifood_account_access(user_id);

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.ifood_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifood_account_access ENABLE ROW LEVEL SECURITY;

-- ifood_accounts: users can see accounts they have access to
CREATE POLICY "ifood_accounts_select_own"
  ON public.ifood_accounts
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT ifood_account_id
      FROM public.ifood_account_access
      WHERE user_id = (select auth.uid())
    )
  );

-- ifood_accounts: admins can see all accounts
CREATE POLICY "ifood_accounts_select_admin"
  ON public.ifood_accounts
  FOR SELECT
  TO authenticated
  USING (public.user_can((select auth.uid()), 'restaurants', 'read'));

-- ifood_accounts: admins can create accounts
CREATE POLICY "ifood_accounts_insert_admin"
  ON public.ifood_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'restaurants', 'create'));

-- ifood_accounts: admins can update accounts
CREATE POLICY "ifood_accounts_update_admin"
  ON public.ifood_accounts
  FOR UPDATE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'restaurants', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'restaurants', 'update'));

-- ifood_accounts: admins can delete accounts
CREATE POLICY "ifood_accounts_delete_admin"
  ON public.ifood_accounts
  FOR DELETE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'restaurants', 'delete'));

-- ifood_account_access: users can see their own access records
CREATE POLICY "ifood_account_access_select_own"
  ON public.ifood_account_access
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ifood_account_access: admins can see all access records
CREATE POLICY "ifood_account_access_select_admin"
  ON public.ifood_account_access
  FOR SELECT
  TO authenticated
  USING (public.user_can((select auth.uid()), 'restaurants', 'read'));

-- ifood_account_access: admins can manage access records
CREATE POLICY "ifood_account_access_insert_admin"
  ON public.ifood_account_access
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'restaurants', 'create'));

CREATE POLICY "ifood_account_access_delete_admin"
  ON public.ifood_account_access
  FOR DELETE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'restaurants', 'delete'));

COMMENT ON TABLE public.ifood_accounts IS 'iFood merchant accounts with OAuth tokens';
COMMENT ON TABLE public.ifood_account_access IS 'Junction table granting users access to iFood accounts';
