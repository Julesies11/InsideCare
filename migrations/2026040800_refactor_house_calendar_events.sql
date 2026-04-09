-- Migration: Refactor house_calendar_events to use Junction Tables
-- Description: Removes type, target_shift, and notes. Replaces single/array assignments with proper many-to-many junction tables.

-- 1. Create Junction Tables
CREATE TABLE IF NOT EXISTS public.house_calendar_event_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.house_calendar_events(id) ON DELETE CASCADE,
    participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(event_id, participant_id)
);

CREATE TABLE IF NOT EXISTS public.house_calendar_event_staff (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.house_calendar_events(id) ON DELETE CASCADE,
    staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(event_id, staff_id)
);

-- 2. Migrate existing single-column data (if migration hasn't run yet)
-- Note: We check if the columns still exist before trying to migrate
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='house_calendar_events' AND column_name='participant_id') THEN
        INSERT INTO public.house_calendar_event_participants (event_id, participant_id)
        SELECT id, participant_id FROM public.house_calendar_events WHERE participant_id IS NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='house_calendar_events' AND column_name='assigned_staff_id') THEN
        INSERT INTO public.house_calendar_event_staff (event_id, staff_id)
        SELECT id, assigned_staff_id FROM public.house_calendar_events WHERE assigned_staff_id IS NOT NULL;
    END IF;
END $$;

-- 3. Drop old columns and redundant fields
ALTER TABLE public.house_calendar_events 
DROP COLUMN IF EXISTS participant_id CASCADE,
DROP COLUMN IF EXISTS assigned_staff_id CASCADE,
DROP COLUMN IF EXISTS participant_ids CASCADE, -- Clean up previous array attempt if it existed
DROP COLUMN IF EXISTS assigned_staff_ids CASCADE, -- Clean up previous array attempt if it existed
DROP COLUMN IF EXISTS type CASCADE,
DROP COLUMN IF EXISTS target_shift CASCADE,
DROP COLUMN IF EXISTS notes CASCADE;

-- 4. Enable RLS on new tables
ALTER TABLE public.house_calendar_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_event_staff ENABLE ROW LEVEL SECURITY;

-- 5. Add basic RLS policies (assuming public read/authenticated write based on app patterns)
-- These should be refined based on the project's specific RLS strategies found in other migrations
CREATE POLICY "Allow authenticated select on event_participants" ON public.house_calendar_event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on event_participants" ON public.house_calendar_event_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on event_participants" ON public.house_calendar_event_participants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on event_participants" ON public.house_calendar_event_participants FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated select on event_staff" ON public.house_calendar_event_staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on event_staff" ON public.house_calendar_event_staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update on event_staff" ON public.house_calendar_event_staff FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete on event_staff" ON public.house_calendar_event_staff FOR DELETE TO authenticated USING (true);
