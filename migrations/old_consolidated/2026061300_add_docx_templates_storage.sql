-- Migration: Add ic_templates storage bucket and RLS policies
-- Description: Creates a bucket for Word templates and configures RBAC-driven access.

BEGIN;

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ic_word_templates', 'ic_word_templates', false) 
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. SELECT Policy: Authenticated users can download templates
-- This ensures staff can generate documents.
DROP POLICY IF EXISTS "RBAC ic_word_templates SELECT" ON storage.objects;
CREATE POLICY "RBAC ic_word_templates SELECT" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'ic_word_templates'::text
);

-- 3. INSERT/UPDATE/DELETE Policy: Admin only
-- Admins are defined as users with 'access_control' level 'full'.
DROP POLICY IF EXISTS "RBAC ic_word_templates ALL ADMIN" ON storage.objects;
CREATE POLICY "RBAC ic_word_templates ALL ADMIN" ON storage.objects FOR ALL TO authenticated USING (
    bucket_id = 'ic_word_templates'::text AND ic_jwt_is_admin()
) WITH CHECK (
    bucket_id = 'ic_word_templates'::text AND ic_jwt_is_admin()
);

COMMIT;
