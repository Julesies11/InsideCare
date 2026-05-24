-- DEV ENVIRONMENT HYDRATION
-- This script creates baseline data so the UI has something to display.

-- 1. Ensure we have an Admin Role
INSERT INTO public.ic_roles (role_name, description)
VALUES ('Admin', 'Full System Access')
ON CONFLICT (role_name) DO NOTHING;

-- 2. Ensure a Branch exists
INSERT INTO public.ic_branches (branch_name, company_name, status)
VALUES ('Main Branch', 'InsideCare Dev', 'Active')
ON CONFLICT DO NOTHING;

-- 3. Ensure a House exists
INSERT INTO public.ic_houses (house_name, status, branch_id)
SELECT 'Demo House', 'active', id FROM public.ic_branches LIMIT 1
ON CONFLICT DO NOTHING;

-- 4. Ensure a Participant exists
INSERT INTO public.ic_participants (participant_name, status, house_id)
SELECT 'John Doe', 'active', id FROM public.ic_houses LIMIT 1
ON CONFLICT DO NOTHING;

-- 5. Link YOU to the Demo House
INSERT INTO public.ic_house_staff_assignments (staff_id, house_id, role_in_house)
SELECT 
  (SELECT id FROM public.ic_staff WHERE auth_user_id = 'c4678a02-43af-4871-90d2-f0d3537359da'),
  (SELECT id FROM public.ic_houses WHERE house_name = 'Demo House'),
  'Primary Care'
ON CONFLICT DO NOTHING;

-- 6. Create a dummy Shift for today
INSERT INTO public.ic_staff_shifts (staff_id, house_id, start_date, end_date, start_time, end_time, status)
SELECT 
  (SELECT id FROM public.ic_staff WHERE auth_user_id = 'c4678a02-43af-4871-90d2-f0d3537359da'),
  (SELECT id FROM public.ic_houses WHERE house_name = 'Demo House'),
  CURRENT_DATE,
  CURRENT_DATE,
  '09:00:00',
  '17:00:00',
  'confirmed'
ON CONFLICT DO NOTHING;
