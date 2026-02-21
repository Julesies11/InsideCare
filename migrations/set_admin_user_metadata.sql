-- Set is_admin = true for the admin test user
-- Run this in the Supabase SQL Editor

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'admin@demo.com';

-- Verify
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'admin@demo.com';
