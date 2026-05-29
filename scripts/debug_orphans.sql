-- 1. Identify the problematic rows
SELECT id, created_by 
FROM public.ic_house_calendar_event_participants 
WHERE created_by IS NOT NULL 
AND created_by NOT IN (SELECT id FROM public.ic_staff);

-- 2. Surgical Cleanup
UPDATE public.ic_house_calendar_event_participants
SET created_by = NULL
WHERE created_by = '1c3fd112-f15c-4d8f-9f7f-c63387e900f1';
