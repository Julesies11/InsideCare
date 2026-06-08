-- Migration: Add Report Preferences Table
-- Date: 2026-06-08
-- Objective: Allow saving single participant report criteria for each staff user.

CREATE TABLE public.ic_report_preferences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL REFERENCES public.ic_staff(id) ON DELETE CASCADE,
    report_type text NOT NULL,
    criteria jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT unique_staff_report UNIQUE (staff_id, report_type)
);

-- Enable RLS
ALTER TABLE public.ic_report_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "RBAC report_preferences SELECT" ON public.ic_report_preferences
    FOR SELECT TO authenticated
    USING (staff_id = ic_jwt_get_staff_id());

CREATE POLICY "RBAC report_preferences INSERT" ON public.ic_report_preferences
    FOR INSERT TO authenticated
    WITH CHECK (staff_id = ic_jwt_get_staff_id());

CREATE POLICY "RBAC report_preferences UPDATE" ON public.ic_report_preferences
    FOR UPDATE TO authenticated
    USING (staff_id = ic_jwt_get_staff_id())
    WITH CHECK (staff_id = ic_jwt_get_staff_id());

CREATE POLICY "RBAC report_preferences DELETE" ON public.ic_report_preferences
    FOR DELETE TO authenticated
    USING (staff_id = ic_jwt_get_staff_id());
