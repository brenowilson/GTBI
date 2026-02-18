-- ============================================================
-- Migration: Storage Buckets
-- Creates required storage buckets with RLS policies
-- ============================================================

-- Avatars bucket (public — profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Reports bucket (private — generated PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Evidences bucket (private — action evidence uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidences',
  'evidences',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS Policies for avatars bucket
-- ============================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can upload/update their own avatar
CREATE POLICY "avatars_user_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_user_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_user_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- RLS Policies for reports bucket
-- ============================================================

-- Users with reports:read permission can download reports
CREATE POLICY "reports_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reports'
  AND public.user_can(auth.uid(), 'reports', 'read')
);

-- Service role can insert (Edge Functions use admin client)
-- No INSERT policy needed for authenticated users — Edge Functions use service role

-- ============================================================
-- RLS Policies for evidences bucket
-- ============================================================

-- Users can upload evidence for their assigned actions
CREATE POLICY "evidences_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidences'
  AND public.user_can(auth.uid(), 'reports', 'update')
);

-- Users with reports:read permission can view evidences
CREATE POLICY "evidences_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidences'
  AND public.user_can(auth.uid(), 'reports', 'read')
);
