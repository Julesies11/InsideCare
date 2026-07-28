-- Add note columns for Mealtime Management (MTM) conditional fields
ALTER TABLE public.ic_shift_notes 
ADD COLUMN mtm_texture_notes text,
ADD COLUMN mtm_consistency_notes text,
ADD COLUMN mtm_positioning_notes text,
ADD COLUMN mtm_supervision_notes text;

-- Update the activity log trigger to include these new columns if necessary (usually handled by generic triggers, but good to note)
COMMENT ON COLUMN public.ic_shift_notes.mtm_texture_notes IS 'Notes describing why food texture was not correct.';
COMMENT ON COLUMN public.ic_shift_notes.mtm_consistency_notes IS 'Notes describing why fluid consistency was not correct.';
COMMENT ON COLUMN public.ic_shift_notes.mtm_positioning_notes IS 'Notes describing why positioning was not appropriate.';
COMMENT ON COLUMN public.ic_shift_notes.mtm_supervision_notes IS 'Notes describing supervision provided when required.';
