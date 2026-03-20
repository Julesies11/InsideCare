-- Migration: Create master tables for lookup fields and add foreign keys
-- Date: 2026-03-14
-- Purpose: Master list of house types and calendar event types, linking them to houses and events

-- 1. Create house_types_master table
CREATE TABLE IF NOT EXISTS public.house_types_master (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create index for name lookups
CREATE INDEX IF NOT EXISTS idx_house_types_master_name ON public.house_types_master USING btree (name);

-- Add house_type_id to houses table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'house_type_id') THEN
    ALTER TABLE public.houses ADD COLUMN house_type_id UUID REFERENCES public.house_types_master(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Create house_calendar_event_types_master table
CREATE TABLE IF NOT EXISTS public.house_calendar_event_types_master (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  color TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create index for name lookups
CREATE INDEX IF NOT EXISTS idx_house_calendar_event_types_master_name ON public.house_calendar_event_types_master USING btree (name);

-- Add event_type_id to house_calendar_events table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'house_calendar_events' AND column_name = 'event_type_id') THEN
    ALTER TABLE public.house_calendar_events ADD COLUMN event_type_id UUID REFERENCES public.house_calendar_event_types_master(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Create house_calendar_event_attachments table
CREATE TABLE IF NOT EXISTS public.house_calendar_event_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.house_calendar_events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NULL,
  mime_type TEXT NULL,
  uploaded_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create index for event_id lookups
CREATE INDEX IF NOT EXISTS idx_house_calendar_event_attachments_event_id ON public.house_calendar_event_attachments USING btree (event_id);

-- 4. House Checklist Enhancements
-- Add scheduled_date to house_checklist_submissions
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'house_checklist_submissions' AND column_name = 'scheduled_date') THEN
    ALTER TABLE public.house_checklist_submissions ADD COLUMN scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE;
    CREATE INDEX IF NOT EXISTS idx_house_checklist_submissions_scheduled_date ON public.house_checklist_submissions USING btree (scheduled_date);
  END IF;
END $$;

-- 5. Create house_comms table (Shift Handover / Daily Notes)
CREATE TABLE IF NOT EXISTS public.house_comms (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  created_by UUID NULL REFERENCES public.staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_house_comms_house_id ON public.house_comms USING btree (house_id);
CREATE INDEX IF NOT EXISTS idx_house_comms_entry_date ON public.house_comms USING btree (entry_date);

-- Add comments
COMMENT ON TABLE public.house_types_master IS 'Master list of house types';
COMMENT ON COLUMN public.house_types_master.name IS 'House type name';
COMMENT ON COLUMN public.house_types_master.description IS 'House type description';
COMMENT ON COLUMN public.house_types_master.status IS 'Active or Inactive';

COMMENT ON TABLE public.house_calendar_event_types_master IS 'Master list of calendar event types';
COMMENT ON COLUMN public.house_calendar_event_types_master.name IS 'Event type name';
COMMENT ON COLUMN public.house_calendar_event_types_master.description IS 'Event type description';
COMMENT ON COLUMN public.house_calendar_event_types_master.status IS 'Active or Inactive';
COMMENT ON COLUMN public.house_calendar_event_types_master.color IS 'Color for calendar highlighting';

COMMENT ON TABLE public.house_calendar_event_attachments IS 'Attachments for house calendar events';

COMMENT ON TABLE public.house_comms IS 'Shift handover notes and daily communication for a house';
COMMENT ON COLUMN public.house_comms.entry_date IS 'The date this communication entry belongs to';

-- Seed data for house types
INSERT INTO public.house_types_master (name, description, status) VALUES
  ('SIL', 'Supported Independent Living', 'Active'),
  ('ILO', 'Individualised Living Options', 'Active'),
  ('SDA', 'Specialist Disability Accommodation', 'Active'),
  ('Short Term Accommodation', 'Short Term Accommodation (Respite)', 'Active'),
  ('Medium Term Accommodation', 'Medium Term Accommodation', 'Active'),
  ('Community Hub', 'Community Hub or Day Program center', 'Active')
ON CONFLICT DO NOTHING;

-- Seed data for calendar event types
INSERT INTO public.house_calendar_event_types_master (name, description, status, color) VALUES
  ('Meeting/Home Visit', 'Staff meetings or home visits', 'Active', 'purple'),
  ('Appointment', 'Doctor, specialist or general appointments', 'Active', 'orange'),
  ('Event/Activity', 'Planned activities or community events', 'Active', 'green'),
  ('Community Access', 'Community access shifts or outings', 'Active', 'blue'),
  ('Maintenance', 'Property maintenance or repairs', 'Active', 'red'),
  ('Other', 'Other event types', 'Active', 'gray')
ON CONFLICT DO NOTHING;
