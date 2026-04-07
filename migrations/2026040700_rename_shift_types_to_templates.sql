-- ======================================================================================
-- Migration: Rename house_shift_types to house_shift_templates
-- Description: Renames the dynamic shift model tables and their foreign keys globally.
-- ======================================================================================

-- 1. Rename the main table and its primary key index
DROP TABLE IF EXISTS public.house_shift_templates CASCADE;
ALTER TABLE public.house_shift_types RENAME TO house_shift_templates;
ALTER INDEX IF EXISTS house_shift_types_pkey RENAME TO house_shift_templates_pkey;

-- Rename policies for the main table
ALTER POLICY "Allow authenticated to view house_shift_types" ON public.house_shift_templates RENAME TO "Allow authenticated to view house_shift_templates";
ALTER POLICY "Allow authenticated to manage house_shift_types" ON public.house_shift_templates RENAME TO "Allow authenticated to manage house_shift_templates";

-- 2. Rename the junction table
ALTER TABLE public.shift_type_default_checklists RENAME TO shift_template_default_checklists;

-- 3. Rename columns across all child tables referencing the shift model
ALTER TABLE public.shift_template_default_checklists RENAME COLUMN shift_type_id TO shift_template_id;
ALTER TABLE public.staff_shifts RENAME COLUMN shift_type_id TO shift_template_id;
ALTER TABLE public.house_checklist_submissions RENAME COLUMN shift_type_id TO shift_template_id;
ALTER TABLE public.shift_assigned_checklists RENAME COLUMN shift_type_id TO shift_template_id;

-- 4. Rename the string text column on staff_shifts
ALTER TABLE public.staff_shifts RENAME COLUMN shift_type TO shift_template;

-- 5. Update metadata comments
COMMENT ON TABLE public.house_shift_templates IS 'Defines house-specific shift periods for task grouping.';
COMMENT ON COLUMN public.staff_shifts.shift_template_id IS 'Link to the dynamic shift model for icons and colors.';
COMMENT ON COLUMN public.shift_assigned_checklists.shift_template_id IS 'Links the routine to a dynamic house shift template (Morning, Night, etc).';
COMMENT ON COLUMN public.staff_shifts.shift_template IS 'String representation of the shift template name.';
