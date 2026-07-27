-- Refactor Shift Note Sleep and Behaviour Tracking
-- YYYYMMDD: 20260709, XX: 00

-- 1. Drop old columns from ic_shift_notes (this automatically drops constraints/foreign keys on these columns)
ALTER TABLE public.ic_shift_notes 
  DROP COLUMN IF EXISTS sleep_start_time,
  DROP COLUMN IF EXISTS sleep_wake_time,
  DROP COLUMN IF EXISTS sleep_type_id,
  DROP COLUMN IF EXISTS sleep_quality_id,
  DROP COLUMN IF EXISTS sleep_support_required,
  DROP COLUMN IF EXISTS behaviour_type_id;

-- 2. Add behaviour_type text column directly on ic_shift_notes
ALTER TABLE public.ic_shift_notes
  ADD COLUMN behaviour_type TEXT;

-- 3. Drop legacy master table ic_behaviour_types_master
DROP TABLE IF EXISTS public.ic_behaviour_types_master CASCADE;

-- 4. Create new sleep records child table
CREATE TABLE public.ic_shift_note_sleep_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_note_id UUID NOT NULL REFERENCES public.ic_shift_notes(id) ON DELETE CASCADE,
  sleep_start_time TIME WITHOUT TIME ZONE,
  sleep_wake_time TIME WITHOUT TIME ZONE,
  sleep_type_id UUID REFERENCES public.ic_sleep_types_master(id) ON DELETE SET NULL,
  sleep_quality_id UUID REFERENCES public.ic_sleep_quality_master(id) ON DELETE SET NULL,
  sleep_support_required TEXT,
  
  -- Audit Columns
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES public.ic_staff(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.ic_staff(id) ON DELETE SET NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.ic_shift_note_sleep_records ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- SELECT policy
CREATE POLICY "RBAC ic_shift_note_sleep_records SELECT" ON public.ic_shift_note_sleep_records
  FOR SELECT TO authenticated USING (
    ic_jwt_is_admin() OR
    EXISTS (
      SELECT 1 FROM public.ic_shift_notes n
      WHERE n.id = shift_note_id
    )
  );

-- INSERT policy
CREATE POLICY "RBAC ic_shift_note_sleep_records INSERT" ON public.ic_shift_note_sleep_records
  FOR INSERT TO authenticated WITH CHECK (
    ic_jwt_is_admin() OR
    EXISTS (
      SELECT 1 FROM public.ic_shift_notes n
      WHERE n.id = shift_note_id
      AND n.staff_id = ic_jwt_get_staff_id()
      AND (ic_jwt_get_perm('participant_shift_notes'::text) = ANY (ARRAY['full'::text, 'context_read_write'::text]))
    )
  );

-- UPDATE policy
CREATE POLICY "RBAC ic_shift_note_sleep_records UPDATE" ON public.ic_shift_note_sleep_records
  FOR UPDATE TO authenticated USING (
    ic_jwt_is_admin() OR
    EXISTS (
      SELECT 1 FROM public.ic_shift_notes n
      WHERE n.id = shift_note_id
      AND n.staff_id = ic_jwt_get_staff_id()
      AND (ic_jwt_get_perm('participant_shift_notes'::text) = ANY (ARRAY['full'::text, 'context_read_write'::text]))
    )
  ) WITH CHECK (
    ic_jwt_is_admin() OR
    EXISTS (
      SELECT 1 FROM public.ic_shift_notes n
      WHERE n.id = shift_note_id
      AND n.staff_id = ic_jwt_get_staff_id()
      AND (ic_jwt_get_perm('participant_shift_notes'::text) = ANY (ARRAY['full'::text, 'context_read_write'::text]))
    )
  );

-- DELETE policy
CREATE POLICY "RBAC ic_shift_note_sleep_records DELETE" ON public.ic_shift_note_sleep_records
  FOR DELETE TO authenticated USING (
    ic_jwt_is_admin() OR
    EXISTS (
      SELECT 1 FROM public.ic_shift_notes n
      WHERE n.id = shift_note_id
      AND n.staff_id = ic_jwt_get_staff_id()
      AND (ic_jwt_get_perm('participant_shift_notes'::text) = ANY (ARRAY['full'::text, 'context_read_write'::text]))
    )
  );

-- 7. Audit Triggers
CREATE TRIGGER ic_trigger_set_sleep_records_audit_columns
  BEFORE INSERT OR UPDATE ON public.ic_shift_note_sleep_records
  FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();
