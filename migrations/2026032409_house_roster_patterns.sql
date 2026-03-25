-- Migration: House Roster Patterns
-- Date: 2026-03-24
-- Description: Stores the 7-day coverage blueprint for a house to enable bulk deployment.

CREATE TABLE IF NOT EXISTS public.house_roster_patterns (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    house_id uuid NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    day_of_week text NOT NULL, -- 'Monday', 'Tuesday', etc.
    shift_type_id uuid NOT NULL REFERENCES public.house_shift_types(id) ON DELETE CASCADE,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Prevents identical pattern entries for the same house/day/time
    UNIQUE(house_id, day_of_week, shift_type_id, start_time)
);

-- Enable RLS
ALTER TABLE public.house_roster_patterns ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated to view house_roster_patterns"
ON public.house_roster_patterns FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage house_roster_patterns"
ON public.house_roster_patterns FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.house_roster_patterns IS 'Stores the recurring 7-day requirement blueprint for a house.';
