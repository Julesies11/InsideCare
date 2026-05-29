-- 1. Check ALL foreign key constraints on the table
SELECT 
    conname AS constraint_name, 
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
WHERE t.relname = 'ic_house_calendar_event_participants';

-- 2. Specifically check BOTH created_by and updated_by for orphans
SELECT 'created_by' as column_name, id, created_by 
FROM public.ic_house_calendar_event_participants 
WHERE created_by IS NOT NULL 
AND created_by NOT IN (SELECT id FROM public.ic_staff)
UNION ALL
SELECT 'updated_by' as column_name, id, updated_by 
FROM public.ic_house_calendar_event_participants 
WHERE updated_by IS NOT NULL 
AND updated_by NOT IN (SELECT id FROM public.ic_staff);
