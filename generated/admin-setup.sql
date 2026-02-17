-- GTBI Admin Setup Script
-- Run this AFTER deploying migrations to create the first admin user.
--
-- INSTRUCTIONS:
-- 1. Create the admin user via Supabase Dashboard (Authentication > Users > Add User)
--    Email: admin@gtbi.com.br
--    Password: [set a strong password]
-- 2. After the user is created (handle_new_user trigger creates the profile automatically),
--    run this script via Supabase SQL Editor or psql to assign the admin role.
-- 3. The admin user will have full access to all features.

-- Step 1: Assign admin role to the first user
DO $$
DECLARE
  v_user_id UUID;
  v_admin_role_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@gtbi.com.br';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User admin@gtbi.com.br not found. Create the user first via Supabase Auth Dashboard.';
  END IF;

  -- Find the admin role (created by seed migration)
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'admin' AND is_system = true;

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Admin role not found. Ensure migrations have been applied first.';
  END IF;

  -- Assign admin role to user
  INSERT INTO public.user_roles (user_id, role_id, assigned_by)
  VALUES (v_user_id, v_admin_role_id, v_user_id)
  ON CONFLICT (user_id, role_id) DO NOTHING;

  RAISE NOTICE 'Admin role successfully assigned to user %', v_user_id;
END $$;

-- Step 2: Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('reports', 'reports', false),
  ('evidences', 'evidences', false)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Storage policies for the reports bucket

-- Authenticated users can read reports they have access to
CREATE POLICY IF NOT EXISTS "Authenticated users can read reports"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'reports');

-- Service role has full access to manage reports (used by Edge Functions)
CREATE POLICY IF NOT EXISTS "Service role can manage reports"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'reports');

-- Step 4: Storage policies for the evidences bucket

-- Authenticated users can read evidence files
CREATE POLICY IF NOT EXISTS "Authenticated users can read evidences"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidences');

-- Authenticated users can upload evidence files
CREATE POLICY IF NOT EXISTS "Authenticated users can upload evidences"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidences');

-- Service role has full access to manage evidences
CREATE POLICY IF NOT EXISTS "Service role can manage evidences"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'evidences');
