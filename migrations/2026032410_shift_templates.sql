-- Migration: Shift Templates
-- Date: 2026-03-24

-- 1. Rename the existing table
ALTER TABLE IF EXISTS public.house_roster_patterns RENAME TO house_shift_templates;

-- 2. Rename policies (if they exist, ignore errors if they don't, but standard SQL doesn't have IF EXISTS for policy rename, so we just do it)
-- Note: Supabase UI sometimes complains, so we drop and recreate
DROP POLICY IF EXISTS "Allow authenticated to view house_roster_patterns" ON public.house_shift_templates;
DROP POLICY IF EXISTS "Allow admins to manage house_roster_patterns" ON public.house_shift_templates;

CREATE POLICY "Allow authenticated to view house_shift_templates"
ON public.house_shift_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage house_shift_templates"
ON public.house_shift_templates FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Create a table to link checklists to shift templates
CREATE TABLE IF NOT EXISTS public.shift_template_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    shift_template_id uuid NOT NULL REFERENCES public.house_shift_templates(id) ON DELETE CASCADE,
    checklist_id uuid NOT NULL REFERENCES public.house_checklists(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(shift_template_id, checklist_id)
);

ALTER TABLE public.shift_template_checklists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to view shift_template_checklists" ON public.shift_template_checklists;
CREATE POLICY "Allow authenticated to view shift_template_checklists"
ON public.shift_template_checklists FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow admins to manage shift_template_checklists" ON public.shift_template_checklists;
CREATE POLICY "Allow admins to manage shift_template_checklists"
ON public.shift_template_checklists FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Update the submissions table
ALTER TABLE public.house_checklist_submissions ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.staff_shifts(id) ON DELETE CASCADE;
ALTER TABLE public.house_checklist_submissions ADD COLUMN IF NOT EXISTS shift_type_id uuid REFERENCES public.house_shift_types(id) ON DELETE SET NULL;
