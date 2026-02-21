-- ============================================================
-- STEP 1: Set is_admin = true on admin@demo.com
-- ============================================================
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'admin@demo.com';

-- ============================================================
-- STEP 2: Check if staff@demo.com exists in auth.users
-- If it does NOT exist, create it via the Supabase dashboard:
--   Authentication > Users > Add User
--   Email: staff@demo.com  Password: demo
-- Then re-run STEP 3 below.
-- ============================================================
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email IN ('admin@demo.com', 'staff@demo.com');

-- ============================================================
-- STEP 3: Link staff@demo.com to a staff row
-- Replace <STAFF_UUID> with the id of the staff row you want
-- to link, and this will auto-fill the auth_user_id.
-- ============================================================

-- First, find the auth user id for staff@demo.com:
-- SELECT id FROM auth.users WHERE email = 'staff@demo.com';

-- Then link it (replace the UUIDs):
-- UPDATE staff
-- SET auth_user_id = '<auth_user_id_from_above>'
-- WHERE id = '<staff_row_id>';

-- ============================================================
-- STEP 4: Verify
-- ============================================================
SELECT
  u.email,
  u.raw_user_meta_data->>'is_admin' AS is_admin,
  s.id AS staff_id,
  s.name AS staff_name,
  s.auth_user_id
FROM auth.users u
LEFT JOIN staff s ON s.auth_user_id = u.id
WHERE u.email IN ('admin@demo.com', 'staff@demo.com');
