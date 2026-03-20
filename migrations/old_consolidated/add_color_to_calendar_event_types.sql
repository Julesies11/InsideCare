-- Migration: Add color column to house_calendar_event_types_master
-- Date: 2026-03-14

-- 1. Add the column with a default
ALTER TABLE public.house_calendar_event_types_master 
ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'blue';

-- 2. Update the existing seeded values with their intended colors
UPDATE public.house_calendar_event_types_master SET color = 'purple' WHERE name = 'Meeting/Home Visit';
UPDATE public.house_calendar_event_types_master SET color = 'orange' WHERE name = 'Appointment';
UPDATE public.house_calendar_event_types_master SET color = 'green' WHERE name = 'Event/Activity';
UPDATE public.house_calendar_event_types_master SET color = 'blue' WHERE name = 'Community Access';
UPDATE public.house_calendar_event_types_master SET color = 'red' WHERE name = 'Maintenance';
UPDATE public.house_calendar_event_types_master SET color = 'gray' WHERE name = 'Other';

-- 3. Add comment
COMMENT ON COLUMN public.house_calendar_event_types_master.color IS 'Color for calendar highlighting';
