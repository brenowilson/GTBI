-- 20260217200006_restaurants.sql
-- Restaurants table and helper function for restaurant access checks

-- ============================================
-- HELPER FUNCTION: user_has_restaurant_access()
-- ============================================

CREATE OR REPLACE FUNCTION public.user_has_restaurant_access(
  p_user_id UUID,
  p_restaurant_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  -- Check if user is system admin
  IF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND r.name = 'admin'
      AND r.is_system = true
  ) THEN
    RETURN true;
  END IF;

  -- Check if user has access via ifood_account_access chain:
  -- user -> ifood_account_access -> ifood_accounts -> restaurants
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurants rest
    JOIN public.ifood_accounts ia ON rest.ifood_account_id = ia.id
    JOIN public.ifood_account_access iaa ON ia.id = iaa.ifood_account_id
    WHERE rest.id = p_restaurant_id
      AND iaa.user_id = p_user_id
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_has_restaurant_access IS 'Checks if a user has access to a restaurant via ifood_account_access chain';

-- ============================================
-- RESTAURANTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ifood_account_id UUID REFERENCES public.ifood_accounts(id) ON DELETE CASCADE NOT NULL,
  ifood_restaurant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  review_auto_reply_enabled BOOLEAN DEFAULT false,
  review_auto_reply_mode TEXT DEFAULT 'template' CHECK (review_auto_reply_mode IN ('template', 'ai')),
  review_reply_template TEXT,
  review_ai_prompt TEXT,
  ticket_auto_reply_enabled BOOLEAN DEFAULT false,
  ticket_auto_reply_mode TEXT DEFAULT 'template' CHECK (ticket_auto_reply_mode IN ('template', 'ai')),
  ticket_reply_template TEXT,
  ticket_ai_prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (ifood_account_id, ifood_restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurants_ifood_account_id
  ON public.restaurants(ifood_account_id);

CREATE INDEX IF NOT EXISTS idx_restaurants_ifood_restaurant_id
  ON public.restaurants(ifood_restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurants_is_active
  ON public.restaurants(is_active);

CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Users can see restaurants belonging to their ifood_accounts (via ifood_account_access)
CREATE POLICY "restaurants_select_own"
  ON public.restaurants
  FOR SELECT
  TO authenticated
  USING (
    ifood_account_id IN (
      SELECT ifood_account_id
      FROM public.ifood_account_access
      WHERE user_id = (select auth.uid())
    )
  );

-- Admins can see all restaurants
CREATE POLICY "restaurants_select_admin"
  ON public.restaurants
  FOR SELECT
  TO authenticated
  USING (public.user_can((select auth.uid()), 'restaurants', 'read'));

-- Admins can create restaurants
CREATE POLICY "restaurants_insert_admin"
  ON public.restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'restaurants', 'create'));

-- Users with access can update their restaurants; admins can update all
CREATE POLICY "restaurants_update_own"
  ON public.restaurants
  FOR UPDATE
  TO authenticated
  USING (
    ifood_account_id IN (
      SELECT ifood_account_id
      FROM public.ifood_account_access
      WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    ifood_account_id IN (
      SELECT ifood_account_id
      FROM public.ifood_account_access
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "restaurants_update_admin"
  ON public.restaurants
  FOR UPDATE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'restaurants', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'restaurants', 'update'));

-- Admins can delete restaurants
CREATE POLICY "restaurants_delete_admin"
  ON public.restaurants
  FOR DELETE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'restaurants', 'delete'));

COMMENT ON TABLE public.restaurants IS 'iFood restaurants linked to merchant accounts with auto-reply configuration';
