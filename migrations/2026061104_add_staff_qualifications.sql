-- 1. Update RBAC Modules (Add to ic_role_permissions table)
ALTER TABLE public.ic_role_permissions ADD COLUMN staff_qualifications public.ic_access_level_enum DEFAULT 'none'::public.ic_access_level_enum NOT NULL;

-- 2. Create the Table
CREATE TABLE public.ic_staff_qualifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    staff_id uuid NOT NULL,
    title text NOT NULL,
    institution text,
    date_completed date,
    expiry_date date,
    file_name text,
    file_path text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_by uuid,
    CONSTRAINT ic_staff_qualifications_pkey PRIMARY KEY (id),
    CONSTRAINT ic_staff_qualifications_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.ic_staff(id) ON DELETE CASCADE
);

-- 3. Enable RLS
ALTER TABLE public.ic_staff_qualifications ENABLE ROW LEVEL SECURITY;

-- 4. Setup Audit Trigger (Metadata & Activity Log)
CREATE TRIGGER set_ic_staff_qualifications_audit BEFORE INSERT OR UPDATE ON public.ic_staff_qualifications FOR EACH ROW EXECUTE FUNCTION public.ic_set_audit_columns();
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT OR UPDATE OR DELETE ON public.ic_staff_qualifications FOR EACH ROW EXECUTE FUNCTION public.ic_audit_trigger_func();

-- 5. Standard RLS Policies

-- SELECT: Admins, Full/Read-Only perm, Context-level if managing staff, or self.
CREATE POLICY "RBAC staff_qualifications SELECT" ON public.ic_staff_qualifications FOR SELECT USING (
  (ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('staff_qualifications'::text) = ANY (ARRAY['full'::text, 'read_only'::text])) OR 
  ((ic_jwt_get_perm('staff_qualifications'::text) = ANY (ARRAY['context_read_write'::text, 'context_read_only'::text])) AND ic_jwt_manages_staff(staff_id)) OR 
  (ic_jwt_get_staff_id() = staff_id))
);

-- ALL (Insert/Update): Admins, Full perm, or Context-level if managing staff.
CREATE POLICY "RBAC staff_qualifications ALL" ON public.ic_staff_qualifications FOR ALL USING (
  (ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('staff_qualifications'::text) = 'full'::text) OR 
  ((ic_jwt_get_perm('staff_qualifications'::text) = 'context_read_write'::text) AND ic_jwt_manages_staff(staff_id)))
) WITH CHECK (
  (ic_jwt_is_admin() OR 
  (ic_jwt_get_perm('staff_qualifications'::text) = 'full'::text) OR 
  ((ic_jwt_get_perm('staff_qualifications'::text) = 'context_read_write'::text) AND ic_jwt_manages_staff(staff_id)))
);

-- DELETE: Admin Only (Project Standard)
CREATE POLICY "RBAC ic_staff_qualifications DELETE (Admin)" ON public.ic_staff_qualifications FOR DELETE USING (ic_jwt_is_admin());

-- 6. Update RBAC Fallback Logic (ic_jwt_get_perm)
-- We need to add the new column to the CASE statement in the fallback function.
-- Since we can't easily 'patch' a function body via simple SQL without re-declaring it, 
-- we provide the updated logic here. (In a real migration, we'd REDEFINE the function).

CREATE OR REPLACE FUNCTION public.ic_jwt_get_perm(p_module text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_perm_text text;
BEGIN
  -- FIRST: Try to get from JWT (Fastest, no recursion)
  v_perm_text := auth.jwt() -> 'app_metadata' -> 'permissions' ->> p_module;
  
  IF v_perm_text IS NOT NULL THEN
    RETURN v_perm_text;
  END IF;

  -- SECOND: Fallback to database lookup
  SELECT 
    CASE p_module
      -- Personal Modules (Staff Portal)
      WHEN 'my_roster' THEN my_roster::text
      WHEN 'my_timesheets' THEN my_timesheets::text
      WHEN 'my_leave' THEN my_leave::text
      WHEN 'shift_routines' THEN shift_routines::text
      
      -- Care Management (Base and Granular)
      WHEN 'participants' THEN participants::text
      WHEN 'participant_goals' THEN participant_goals::text
      WHEN 'participant_behaviour' THEN participant_behaviour::text
      WHEN 'participant_support_needs' THEN participant_support_needs::text
      WHEN 'participant_mealtime' THEN participant_mealtime::text
      WHEN 'participant_medical_routine' THEN participant_medical_routine::text
      WHEN 'participant_clinical_trackers' THEN participant_clinical_trackers::text
      WHEN 'participant_medications' THEN participant_medications::text
      WHEN 'participant_emergency' THEN participant_emergency::text
      WHEN 'participant_contacts' THEN participant_contacts::text
      WHEN 'participant_documents' THEN participant_documents::text
      WHEN 'participant_shift_notes' THEN participant_shift_notes::text
      WHEN 'participant_activity_log' THEN participant_activity_log::text
      WHEN 'shift_notes' THEN shift_notes::text
      
      -- Employees & HR (Base and Granular)
      WHEN 'employees' THEN employees::text
      WHEN 'staff_employment' THEN staff_employment::text
      WHEN 'staff_availability' THEN staff_availability::text
      WHEN 'staff_emergency' THEN staff_emergency::text
      WHEN 'staff_compliance' THEN staff_compliance::text
      WHEN 'staff_onboarding' THEN staff_onboarding::text
      WHEN 'staff_training' THEN staff_training::text
      WHEN 'staff_qualifications' THEN staff_qualifications::text
      WHEN 'staff_documents' THEN staff_documents::text
      WHEN 'staff_roster' THEN staff_roster::text
      WHEN 'staff_leave' THEN staff_leave::text
      WHEN 'staff_warnings' THEN staff_warnings::text
      WHEN 'staff_activity_log' THEN staff_activity_log::text
      
      -- House Management
      WHEN 'house_management' THEN house_management::text
      WHEN 'house_operations' THEN house_operations::text
      WHEN 'house_checklists' THEN house_checklists::text
      WHEN 'house_checklist_history' THEN house_checklist_history::text
      WHEN 'house_resources' THEN house_resources::text
      WHEN 'house_comms' THEN house_comms::text
      WHEN 'house_files' THEN house_files::text
      WHEN 'house_compliance' THEN house_compliance::text
      
      -- Administration & System
      WHEN 'access_control' THEN access_control::text
      WHEN 'admin_onboarding' THEN admin_onboarding::text
      WHEN 'activity_log' THEN activity_log::text
      WHEN 'roster_manager' THEN roster_manager::text
      WHEN 'timesheet_manager' THEN timesheet_manager::text
      WHEN 'medications_master' THEN medications_master::text
      WHEN 'compliance_master' THEN compliance_master::text
      WHEN 'funding_master' THEN funding_master::text
      WHEN 'branch_management' THEN branch_management::text
      
      -- Reporting
      WHEN 'reporting_clinical' THEN reporting_clinical::text
      WHEN 'reporting_operational' THEN reporting_operational::text
      WHEN 'reporting_compliance' THEN reporting_compliance::text
      ELSE 'none'
    END INTO v_perm_text
  FROM public.ic_role_permissions
  WHERE role_id = public.ic_jwt_get_role_id()
  LIMIT 1;

  RETURN COALESCE(v_perm_text, 'none');
END;
$function$;

-- 7. Update Audit Log Resolver (Add 'title' to COALESCE)
-- This ensures human-readable names for Qualification records in activity logs.

CREATE OR REPLACE FUNCTION public.ic_audit_trigger_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    target_data JSONB;
    entity_name_val TEXT;
    user_name_val TEXT;
    acting_staff_id UUID;
BEGIN
    acting_staff_id := public.ic_jwt_get_staff_id();
    
    -- Resolve acting user name
    SELECT staff_name INTO user_name_val FROM public.ic_staff WHERE id = acting_staff_id LIMIT 1;
    
    target_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;

    -- Resolve Entity Name (Primary Check)
    -- ADDED 'title' for Qualifications support
    entity_name_val := COALESCE(
        target_data->>'reference_id',
        target_data->>'title',
        target_data->>'file_name',
        target_data->>'staff_name', 
        target_data->>'participant_name',
        target_data->>'name'
    );

    -- Resolve names for ID-only records dynamically from master tables
    IF entity_name_val IS NULL THEN
        IF TG_TABLE_NAME = 'ic_staff_compliance' THEN
            SELECT compliance_name INTO entity_name_val FROM public.ic_compliance_types_master WHERE id = (target_data->>'compliance_type_id')::uuid;
        ELSIF TG_TABLE_NAME = 'ic_staff_onboarding' THEN
            SELECT item_name INTO entity_name_val FROM public.ic_onboarding_items_master WHERE id = (target_data->>'onboarding_item_id')::uuid;
        ELSIF TG_TABLE_NAME = 'ic_participant_medications' THEN
            SELECT medication_name INTO entity_name_val FROM public.ic_medications_master WHERE id = (target_data->>'medication_id')::uuid;
        END IF;
    END IF;

    -- Standard Audit Log Insertion
    INSERT INTO public.ic_activity_log (
        activity_type, entity_type, entity_id, entity_name, description, user_name, user_id
    ) VALUES (
        LOWER(TG_OP), REPLACE(TG_TABLE_NAME, 'ic_', ''), (target_data->>'id'), entity_name_val, 
        INITCAP(TG_OP) || ' ' || REPLACE(TG_TABLE_NAME, 'ic_', '') || ': ' || COALESCE(entity_name_val, 'ID ' || (target_data->>'id')),
        COALESCE(user_name_val, 'System'), acting_staff_id
    );

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;
