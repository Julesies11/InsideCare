-- 0. SCHEMA UPDATES
-- Make house_checklists frequency nullable as it moves to the schedule layer
ALTER TABLE public.house_checklists ALTER COLUMN frequency DROP NOT NULL;

-- ============================================================
-- 1. NEW TABLE: checklist_schedules
-- ============================================================

CREATE TABLE IF NOT EXISTS public.checklist_schedules (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4 (),
  house_id uuid NOT NULL,
  house_checklist_id uuid NOT NULL, -- Links to the House's specific version of the checklist
  rrule text NOT NULL, -- RFC 5545 string
  start_date date NOT NULL,
  end_date date NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT checklist_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_schedules_house_id_fkey FOREIGN KEY (house_id) REFERENCES houses (id) ON DELETE CASCADE,
  CONSTRAINT checklist_schedules_house_checklist_id_fkey FOREIGN KEY (house_checklist_id) REFERENCES house_checklists (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_checklist_schedules_house_id ON public.checklist_schedules (house_id);
CREATE INDEX IF NOT EXISTS idx_checklist_schedules_active ON public.checklist_schedules (is_active);

-- Trigger for updated_at
CREATE TRIGGER update_checklist_schedules_updated_at BEFORE UPDATE ON checklist_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. UPDATES TO house_calendar_events
-- ============================================================

-- Add columns to link calendar events to schedules and checklists
ALTER TABLE public.house_calendar_events 
ADD COLUMN IF NOT EXISTS checklist_schedule_id uuid REFERENCES public.checklist_schedules(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS house_checklist_id uuid REFERENCES public.house_checklists(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_checklist_event boolean DEFAULT false;

-- Index for filtering checklist events
CREATE INDEX IF NOT EXISTS idx_house_calendar_events_checklist ON public.house_calendar_events (is_checklist_event) WHERE is_checklist_event = true;

-- ============================================================
-- 3. UPDATES TO house_checklist_submissions
-- ============================================================

-- Link actual work to a specific calendar slot
ALTER TABLE public.house_checklist_submissions
ADD COLUMN IF NOT EXISTS calendar_event_id uuid REFERENCES public.house_calendar_events(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS scheduled_date date;

-- Index for checking submission status by date/event
CREATE INDEX IF NOT EXISTS idx_checklist_submissions_calendar_event ON public.house_checklist_submissions (calendar_event_id);

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

ALTER TABLE public.checklist_schedules ENABLE ROW LEVEL SECURITY;

-- ADMIN: Full Access
CREATE POLICY "Admins full access to checklist_schedules" 
ON public.checklist_schedules FOR ALL TO authenticated 
USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- STAFF: Read access to their assigned house schedules
CREATE POLICY "Staff read assigned checklist_schedules" 
ON public.checklist_schedules FOR SELECT TO authenticated 
USING (house_id IN (SELECT hsa.house_id FROM house_staff_assignments hsa JOIN staff s ON s.id = hsa.staff_id WHERE s.auth_user_id = auth.uid()));

-- ============================================================
-- 5. COMMENTS
-- ============================================================

COMMENT ON TABLE public.checklist_schedules IS 'Stores recurrence rules for checklists assigned to houses';
COMMENT ON COLUMN public.checklist_schedules.rrule IS 'RFC 5545 string for recurrence';
COMMENT ON COLUMN public.house_calendar_events.is_checklist_event IS 'Flag to identify events generated from a checklist schedule';
COMMENT ON COLUMN public.house_checklist_submissions.calendar_event_id IS 'Links the submission to a specific day on the house calendar';
