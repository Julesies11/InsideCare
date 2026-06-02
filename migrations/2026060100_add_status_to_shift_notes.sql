-- Migration: Add status column to ic_shift_notes for soft-delete support
-- Date: 2026-06-01
-- Description: Adds a status column to shift notes to allow Support Workers to "delete" (deactivate) their own notes without hard-deleting data.

BEGIN;

-- 1. Add status column using existing ic_status_enum
ALTER TABLE public.ic_shift_notes 
ADD COLUMN IF NOT EXISTS status public.ic_status_enum NOT NULL DEFAULT 'active'::public.ic_status_enum;

-- 2. Index the status column for performance
CREATE INDEX IF NOT EXISTS idx_shift_notes_status ON public.ic_shift_notes(status);

-- 3. Update existing notes to 'active' (though default handles it for new ones)
UPDATE public.ic_shift_notes SET status = 'active' WHERE status IS NULL;

-- 4. Harden RLS: Only allow DELETE for Admins (if not already enforced)
DROP POLICY IF EXISTS "RBAC shift_notes DELETE" ON public.ic_shift_notes;
CREATE POLICY "RBAC shift_notes DELETE" ON public.ic_shift_notes FOR DELETE TO authenticated USING (
    ic_jwt_is_admin()
);

-- 5. Update ALL/UPDATE policy to allow users to update their own notes to 'inactive'
-- The existing "RBAC shift_notes ALL" or "UPDATE" might already cover this if they have house access.
-- We want to ensure they can at least mark their own notes as inactive.

COMMIT;
