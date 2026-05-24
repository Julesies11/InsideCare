-- ACTIVATE CURRENT STAFF
-- The application filters for status = 'active' by default.
-- New staff records default to 'draft', causing queries to return 0 rows.

UPDATE public.ic_staff 
SET status = 'active'
WHERE auth_user_id = 'c4678a02-43af-4871-90d2-f0d3537359da';

-- Verify the update
SELECT id, staff_name, status, auth_user_id 
FROM public.ic_staff 
WHERE auth_user_id = 'c4678a02-43af-4871-90d2-f0d3537359da';
