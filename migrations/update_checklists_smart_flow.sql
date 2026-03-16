-- Update House Checklists for Smart Flow (Day-Specific and Shift-Linked)

DO $$
BEGIN
  -- 1. Add days_of_week to house_checklists to support "Day Specific" checklists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'house_checklists' AND column_name = 'days_of_week') THEN
    ALTER TABLE public.house_checklists ADD COLUMN days_of_week text[] DEFAULT NULL;
    COMMENT ON COLUMN public.house_checklists.days_of_week IS 'Array of days (Monday, Tuesday, etc.) for weekly checklists';
  END IF;

  -- 2. Add days_of_week to checklist_master to support "Day Specific" templates
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklist_master' AND column_name = 'days_of_week') THEN
    ALTER TABLE public.checklist_master ADD COLUMN days_of_week text[] DEFAULT NULL;
    COMMENT ON COLUMN public.checklist_master.days_of_week IS 'Array of days (Monday, Tuesday, etc.) for weekly checklists';
  END IF;

  -- 3. Add shift_id to house_checklist_submissions to link completions to rostered shifts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'house_checklist_submissions' AND column_name = 'shift_id') THEN
    ALTER TABLE public.house_checklist_submissions ADD COLUMN shift_id uuid REFERENCES public.staff_shifts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_house_checklist_submissions_shift_id ON public.house_checklist_submissions (shift_id);
    COMMENT ON COLUMN public.house_checklist_submissions.shift_id IS 'The rostered shift during which this checklist was performed';
  END IF;

END $$;
