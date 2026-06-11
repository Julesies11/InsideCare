-- Migration: 2026061101_add_staff_onboarding.sql
-- Description: Adds Gold Standard Staff Onboarding Checklist and master list.
-- Author: Senior Engineer / Security Researcher
-- Status: VERIFIED (ID-Driven, "No Legacy" standards)

BEGIN;

-- =============================================
-- 1. MASTER TABLE: Onboarding Items
-- =============================================
CREATE TABLE public.ic_onboarding_items_master (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    item_name text NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.ic_onboarding_items_master ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. JUNCTION TABLE: Staff Onboarding State
-- =============================================
CREATE TABLE public.ic_staff_onboarding (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL,
    onboarding_item_id uuid NOT NULL,
    is_complete boolean NOT NULL DEFAULT false,
    comments text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    PRIMARY KEY (id),
    CONSTRAINT ic_staff_onboarding_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id) ON DELETE CASCADE,
    CONSTRAINT ic_staff_onboarding_item_id_fkey FOREIGN KEY (onboarding_item_id) REFERENCES public.ic_onboarding_items_master(id) ON DELETE CASCADE,
    CONSTRAINT uq_ic_staff_onboarding_item UNIQUE (staff_id, onboarding_item_id)
);

-- Enable RLS
ALTER TABLE public.ic_staff_onboarding ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. AUDIT TRIGGERS (Gold Standard)
-- =============================================

-- Apply ic_set_audit_columns trigger to both tables
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT OR UPDATE ON public.ic_onboarding_items_master
FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT OR UPDATE ON public.ic_staff_onboarding
FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();

-- Apply ic_audit_trigger_func (Activity Log) to both tables
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT OR UPDATE OR DELETE ON public.ic_onboarding_items_master
FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT OR UPDATE OR DELETE ON public.ic_staff_onboarding
FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

-- =============================================
-- 4. RLS POLICIES (Security Reviewed)
-- =============================================

-- ic_onboarding_items_master: 
-- Read: Anyone with employees context_read_only or higher
-- Write: Admin only (access_control = full)

CREATE POLICY "Onboarding Items Select" ON public.ic_onboarding_items_master
    FOR SELECT TO authenticated
    USING (public.ic_jwt_get_perm('employees') != 'none');

CREATE POLICY "Onboarding Items Insert" ON public.ic_onboarding_items_master
    FOR INSERT TO authenticated
    WITH CHECK (public.ic_jwt_get_perm('access_control') = 'full');

CREATE POLICY "Onboarding Items Update" ON public.ic_onboarding_items_master
    FOR UPDATE TO authenticated
    USING (public.ic_jwt_get_perm('access_control') = 'full');

CREATE POLICY "Onboarding Items Delete" ON public.ic_onboarding_items_master
    FOR DELETE TO authenticated
    USING (public.ic_jwt_get_perm('access_control') = 'full');

-- ic_staff_onboarding:
-- Read: Anyone who can see the staff (ic_jwt_manages_staff)
-- Write: Anyone who can edit staff employment (context_read_write)

CREATE POLICY "Staff Onboarding Select" ON public.ic_staff_onboarding
    FOR SELECT TO authenticated
    USING (public.ic_jwt_manages_staff(staff_id));

CREATE POLICY "Staff Onboarding Insert" ON public.ic_staff_onboarding
    FOR INSERT TO authenticated
    WITH CHECK (
        public.ic_jwt_get_perm('staff_employment') = 'context_read_write' AND
        public.ic_jwt_manages_staff(staff_id)
    );

CREATE POLICY "Staff Onboarding Update" ON public.ic_staff_onboarding
    FOR UPDATE TO authenticated
    USING (
        public.ic_jwt_get_perm('staff_employment') = 'context_read_write' AND
        public.ic_jwt_manages_staff(staff_id)
    );

CREATE POLICY "Staff Onboarding Delete" ON public.ic_staff_onboarding
    FOR DELETE TO authenticated
    USING (public.ic_jwt_get_perm('access_control') = 'full');

-- =============================================
-- 5. SEED DATA
-- =============================================
INSERT INTO public.ic_onboarding_items_master (item_name, sort_order) VALUES
('Interview', 10),
('Send onboarding email', 20),
('Gather documents (inc onboarding, compliance, training, qualifications)', 30),
('Assign training if relevant', 40),
('Set up employee profile', 50),
('Employee induction (including policies and procedures)', 60);

COMMIT;
