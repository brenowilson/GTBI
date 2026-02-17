-- 20260217200003_users.sql
-- User profiles table with auto-creation trigger on auth.users insert

-- ============================================
-- USER PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email
  ON public.user_profiles(email);

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active
  ON public.user_profiles(is_active);

-- Updated_at trigger
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- TRIGGER: Auto-create user_profile on auth.users insert
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Creates a user_profiles row when a new auth.users row is inserted';

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

-- Admins can read all profiles
CREATE POLICY "user_profiles_select_admin"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'read'));

-- Users can update their own profile
CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- Admins can update any profile
CREATE POLICY "user_profiles_update_admin"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'update'));

COMMENT ON TABLE public.user_profiles IS 'Extended user profile data linked to auth.users';
