-- Migration: Organization Level Shift Templates
-- Date: 2026-03-26
-- Description: Creates global shift modes (Morning, Day, Night, etc.) at the organization level.

-- 1. Create the Org Shift Templates table
CREATE TABLE IF NOT EXISTS public.org_shift_templates (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    short_name text NULL,
    start_time_default time without time zone NULL,
    end_time_default time without time zone NULL,
    icon_name text NULL,
    color_theme text NULL,
    sort_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT org_shift_templates_pkey PRIMARY KEY (id),
    UNIQUE (name)
);

-- 2. Add foreign key to staff_shifts (Nullable to keep old data working)
ALTER TABLE public.staff_shifts ADD COLUMN IF NOT EXISTS org_shift_template_id uuid REFERENCES public.org_shift_templates(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.org_shift_templates ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Allow authenticated to view org_shift_templates"
ON public.org_shift_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage org_shift_templates"
ON public.org_shift_templates FOR ALL
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- 5. Backfill common defaults with correct color_theme and icon_name from SHIFT_ICONS
INSERT INTO public.org_shift_templates (name, short_name, start_time_default, end_time_default, icon_name, color_theme, sort_order)
VALUES 
('Morning', 'M', '07:00', '15:00', 'Sun', 'morning', 10),
('Day', 'D', '09:00', '17:00', 'CloudSun', 'day', 20),
('Afternoon', 'A', '15:00', '23:00', 'Sunset', 'afternoon', 25),
('Night', 'N', '23:00', '07:00', 'Moon', 'night', 30),
('Sleepover', 'S', '22:00', '08:00', 'Bed', 'night', 40),
('Community', 'C', '09:00', '17:00', 'Users', 'community', 50)
ON CONFLICT (name) DO NOTHING;
