-- 20260217200002_rbac.sql
-- Role-Based Access Control: roles, feature_groups, features, feature_actions,
-- role_permissions, user_roles
-- Helper functions: user_can(), get_user_permissions()

-- ============================================
-- ROLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- FEATURE GROUPS
-- ============================================

CREATE TABLE IF NOT EXISTS public.feature_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================
-- FEATURES
-- ============================================

CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_group_id UUID REFERENCES public.feature_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_features_feature_group_id
  ON public.features(feature_group_id);

-- ============================================
-- FEATURE ACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.feature_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES public.features(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (feature_id, action)
);

CREATE INDEX IF NOT EXISTS idx_feature_actions_feature_id
  ON public.feature_actions(feature_id);

-- ============================================
-- ROLE PERMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  feature_action_id UUID REFERENCES public.feature_actions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (role_id, feature_action_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id
  ON public.role_permissions(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_feature_action_id
  ON public.role_permissions(feature_action_id);

-- ============================================
-- USER ROLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id
  ON public.user_roles(role_id);

-- ============================================
-- HELPER FUNCTION: user_can()
-- ============================================

CREATE OR REPLACE FUNCTION public.user_can(
  p_user_id UUID,
  p_feature_code TEXT,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_has_permission BOOLEAN;
BEGIN
  -- Check if user has admin role (system admin has all permissions)
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND r.name = 'admin'
      AND r.is_system = true
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  -- Check specific permission
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.feature_actions fa ON rp.feature_action_id = fa.id
    JOIN public.features f ON fa.feature_id = f.id
    WHERE ur.user_id = p_user_id
      AND f.code = p_feature_code
      AND fa.action = p_action
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.user_can IS 'Checks if a user has permission to perform a specific action on a feature';

-- ============================================
-- HELPER FUNCTION: get_user_permissions()
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE (feature_code TEXT, action TEXT) AS $$
BEGIN
  -- If user is system admin, return all feature_code/action combinations
  IF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND r.name = 'admin'
      AND r.is_system = true
  ) THEN
    RETURN QUERY
    SELECT f.code, fa.action
    FROM public.features f
    JOIN public.feature_actions fa ON fa.feature_id = f.id;
    RETURN;
  END IF;

  -- Otherwise return only granted permissions
  RETURN QUERY
  SELECT DISTINCT f.code, fa.action
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role_id = rp.role_id
  JOIN public.feature_actions fa ON rp.feature_action_id = fa.id
  JOIN public.features f ON fa.feature_id = f.id
  WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_permissions IS 'Returns all permissions (feature_code, action) for a user';

-- ============================================
-- RLS ON ALL RBAC TABLES
-- ============================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- READ: all authenticated users can read RBAC tables (needed for the system to work)
CREATE POLICY "roles_select_authenticated"
  ON public.roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "feature_groups_select_authenticated"
  ON public.feature_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "features_select_authenticated"
  ON public.features FOR SELECT TO authenticated USING (true);

CREATE POLICY "feature_actions_select_authenticated"
  ON public.feature_actions FOR SELECT TO authenticated USING (true);

CREATE POLICY "role_permissions_select_authenticated"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- user_roles: users can read their own roles
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- user_roles: admins can read all user roles
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'read'));

-- WRITE: only admins can modify RBAC tables
CREATE POLICY "roles_insert_admin"
  ON public.roles FOR INSERT TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'create'));

CREATE POLICY "roles_update_admin"
  ON public.roles FOR UPDATE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'update'));

CREATE POLICY "roles_delete_admin"
  ON public.roles FOR DELETE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'delete'));

CREATE POLICY "feature_groups_insert_admin"
  ON public.feature_groups FOR INSERT TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'create'));

CREATE POLICY "feature_groups_update_admin"
  ON public.feature_groups FOR UPDATE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'update'));

CREATE POLICY "feature_groups_delete_admin"
  ON public.feature_groups FOR DELETE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'delete'));

CREATE POLICY "features_insert_admin"
  ON public.features FOR INSERT TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'create'));

CREATE POLICY "features_update_admin"
  ON public.features FOR UPDATE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'update'));

CREATE POLICY "features_delete_admin"
  ON public.features FOR DELETE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'delete'));

CREATE POLICY "feature_actions_insert_admin"
  ON public.feature_actions FOR INSERT TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'create'));

CREATE POLICY "feature_actions_update_admin"
  ON public.feature_actions FOR UPDATE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'update'));

CREATE POLICY "feature_actions_delete_admin"
  ON public.feature_actions FOR DELETE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'delete'));

CREATE POLICY "role_permissions_insert_admin"
  ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'create'));

CREATE POLICY "role_permissions_update_admin"
  ON public.role_permissions FOR UPDATE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'update'));

CREATE POLICY "role_permissions_delete_admin"
  ON public.role_permissions FOR DELETE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'delete'));

CREATE POLICY "user_roles_insert_admin"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'create'));

CREATE POLICY "user_roles_update_admin"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'update'))
  WITH CHECK (public.user_can((select auth.uid()), 'users', 'update'));

CREATE POLICY "user_roles_delete_admin"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.user_can((select auth.uid()), 'users', 'delete'));

-- ============================================
-- SEED DATA
-- ============================================

-- Admin role (system role, cannot be deleted)
INSERT INTO public.roles (name, description, is_system)
VALUES ('admin', 'System administrator with full access', true)
ON CONFLICT (name) DO NOTHING;

-- Feature groups
INSERT INTO public.feature_groups (name) VALUES
  ('users'),
  ('restaurants'),
  ('reports'),
  ('reviews'),
  ('tickets'),
  ('financial'),
  ('catalog')
ON CONFLICT (name) DO NOTHING;

-- Features (one per group, code matches group name)
INSERT INTO public.features (feature_group_id, name, code)
SELECT fg.id, fg.name, fg.name
FROM public.feature_groups fg
ON CONFLICT (code) DO NOTHING;

-- Feature actions: CRUD for each feature
INSERT INTO public.feature_actions (feature_id, action)
SELECT f.id, a.action
FROM public.features f
CROSS JOIN (VALUES ('create'), ('read'), ('update'), ('delete')) AS a(action)
ON CONFLICT (feature_id, action) DO NOTHING;

-- Grant ALL permissions to admin role
INSERT INTO public.role_permissions (role_id, feature_action_id)
SELECT r.id, fa.id
FROM public.roles r
CROSS JOIN public.feature_actions fa
WHERE r.name = 'admin' AND r.is_system = true
ON CONFLICT (role_id, feature_action_id) DO NOTHING;
