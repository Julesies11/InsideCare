-- Migration: Org Shift Template Default Checklists
-- Date: 2026-03-26
-- Description: Allows linking global shift modes to master checklist templates.

-- 1. Create the link table
CREATE TABLE IF NOT EXISTS public.org_shift_template_checklists (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    org_shift_template_id uuid REFERENCES public.org_shift_templates(id) ON DELETE CASCADE,
    checklist_master_id uuid REFERENCES public.checklist_master(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT org_shift_template_checklists_pkey PRIMARY KEY (id),
    UNIQUE (org_shift_template_id, checklist_master_id)
);

-- 2. Enable RLS
ALTER TABLE public.org_shift_template_checklists ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Allow authenticated to view org_shift_template_checklists"
ON public.org_shift_template_checklists FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage org_shift_template_checklists"
ON public.org_shift_template_checklists FOR ALL
TO authenticated
USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
