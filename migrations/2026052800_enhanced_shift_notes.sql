-- Migration: Enhanced & Normalized Shift Notes
-- Date: 2026-05-28
-- Description: Expand ic_shift_notes with clinical modules and add master list tables for seizure and behaviour types.

-- 1. Update Shift Period Enum
ALTER TYPE public.ic_shift_period_enum ADD VALUE IF NOT EXISTS 'afternoon';
ALTER TYPE public.ic_shift_period_enum ADD VALUE IF NOT EXISTS 'evening';
ALTER TYPE public.ic_shift_period_enum ADD VALUE IF NOT EXISTS 'sleepover';

-- 2. Create Master List Tables
-- 2.1. Seizure Types Master
CREATE TABLE IF NOT EXISTS public.ic_seizure_types_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

ALTER TABLE public.ic_seizure_types_master ENABLE ROW LEVEL SECURITY;

-- 2.2. Behaviour Types Master
CREATE TABLE IF NOT EXISTS public.ic_behaviour_types_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

ALTER TABLE public.ic_behaviour_types_master ENABLE ROW LEVEL SECURITY;

-- 3. Expand ic_shift_notes Table
ALTER TABLE public.ic_shift_notes 
ADD COLUMN IF NOT EXISTS shift_type public.ic_shift_period_enum,
ADD COLUMN IF NOT EXISTS risks_observed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS risk_description TEXT,
ADD COLUMN IF NOT EXISTS overall_presentation TEXT,
ADD COLUMN IF NOT EXISTS adl_supports TEXT,
ADD COLUMN IF NOT EXISTS domestic_tasks TEXT,
ADD COLUMN IF NOT EXISTS capacity_building_goals TEXT,
ADD COLUMN IF NOT EXISTS regular_medication_status TEXT,
ADD COLUMN IF NOT EXISTS prn_medication_given BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prn_description TEXT,
ADD COLUMN IF NOT EXISTS pbs_strategies_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pbs_strategies_details TEXT,
ADD COLUMN IF NOT EXISTS pbs_when_used TEXT,
ADD COLUMN IF NOT EXISTS pbs_outcome TEXT,
ADD COLUMN IF NOT EXISTS restrictive_practices_status TEXT,
ADD COLUMN IF NOT EXISTS shift_summary TEXT,

-- Bowel Tracking
ADD COLUMN IF NOT EXISTS bowel_movement_occurred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bowel_time TIME,
ADD COLUMN IF NOT EXISTS bowel_bristol_scale INTEGER CHECK (bowel_bristol_scale BETWEEN 1 AND 7),
ADD COLUMN IF NOT EXISTS bowel_amount TEXT,
ADD COLUMN IF NOT EXISTS bowel_assistance_required TEXT,
ADD COLUMN IF NOT EXISTS bowel_notes TEXT,

-- Seizure Activity
ADD COLUMN IF NOT EXISTS seizure_occurred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seizure_time_started TIME,
ADD COLUMN IF NOT EXISTS seizure_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS seizure_type_id UUID REFERENCES public.ic_seizure_types_master(id),
ADD COLUMN IF NOT EXISTS seizure_description TEXT,
ADD COLUMN IF NOT EXISTS seizure_injury_occurred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seizure_injury_description TEXT,
ADD COLUMN IF NOT EXISTS seizure_emergency_services BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS seizure_notes TEXT,

-- Sleep Tracking
ADD COLUMN IF NOT EXISTS sleep_occurred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sleep_type_period TEXT,
ADD COLUMN IF NOT EXISTS sleep_start_time TIME,
ADD COLUMN IF NOT EXISTS sleep_wake_time TIME,
ADD COLUMN IF NOT EXISTS sleep_quality TEXT,
ADD COLUMN IF NOT EXISTS sleep_support_required TEXT,

-- Behaviour Observation
ADD COLUMN IF NOT EXISTS behaviour_observed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS behaviour_type_id UUID REFERENCES public.ic_behaviour_types_master(id),
ADD COLUMN IF NOT EXISTS behaviour_intensity TEXT,
ADD COLUMN IF NOT EXISTS behaviour_notes TEXT,

-- Community Participation
ADD COLUMN IF NOT EXISTS community_access_occurred BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS community_activity_type TEXT,
ADD COLUMN IF NOT EXISTS community_location TEXT,
ADD COLUMN IF NOT EXISTS community_engagement_level TEXT,
ADD COLUMN IF NOT EXISTS community_notes TEXT,

-- Nutrition Tracker
ADD COLUMN IF NOT EXISTS meal_provided BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nutrition_meal_type TEXT,
ADD COLUMN IF NOT EXISTS nutrition_intake TEXT,
ADD COLUMN IF NOT EXISTS nutrition_refusal_alternatives TEXT,
ADD COLUMN IF NOT EXISTS nutrition_assistance_needed TEXT,
ADD COLUMN IF NOT EXISTS nutrition_fluids_intake TEXT,
ADD COLUMN IF NOT EXISTS nutrition_notes TEXT,

-- Mealtime Management
ADD COLUMN IF NOT EXISTS mtm_meal_provided BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mtm_diet_type TEXT,
ADD COLUMN IF NOT EXISTS mtm_fluids TEXT,
ADD COLUMN IF NOT EXISTS mtm_texture_correct BOOLEAN,
ADD COLUMN IF NOT EXISTS mtm_consistency_correct BOOLEAN,
ADD COLUMN IF NOT EXISTS mtm_positioning_appropriate BOOLEAN,
ADD COLUMN IF NOT EXISTS mtm_supervision_required BOOLEAN,
ADD COLUMN IF NOT EXISTS mtm_swallowing_concerns TEXT,
ADD COLUMN IF NOT EXISTS mtm_meal_intake TEXT,
ADD COLUMN IF NOT EXISTS mtm_meal_intake_notes TEXT,
ADD COLUMN IF NOT EXISTS mtm_fluid_intake TEXT,
ADD COLUMN IF NOT EXISTS mtm_fluid_intake_notes TEXT,
ADD COLUMN IF NOT EXISTS mtm_concerns TEXT,
ADD COLUMN IF NOT EXISTS mtm_notes TEXT,

-- Hygiene Tracking
ADD COLUMN IF NOT EXISTS hygiene_support_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hygiene_shower TEXT,
ADD COLUMN IF NOT EXISTS hygiene_oral_care TEXT,
ADD COLUMN IF NOT EXISTS hygiene_toileting TEXT,
ADD COLUMN IF NOT EXISTS hygiene_grooming TEXT,
ADD COLUMN IF NOT EXISTS hygiene_observed_concerns TEXT,
ADD COLUMN IF NOT EXISTS hygiene_notes TEXT;

-- 4. Audit Triggers
-- Seizure Types
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT OR UPDATE OR DELETE ON public.ic_seizure_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT OR UPDATE ON public.ic_seizure_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
CREATE TRIGGER ic_update_updated_at_column BEFORE UPDATE ON public.ic_seizure_types_master FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();

-- Behaviour Types
CREATE TRIGGER ic_audit_universal_trigger AFTER INSERT OR UPDATE OR DELETE ON public.ic_behaviour_types_master FOR EACH ROW EXECUTE FUNCTION ic_audit_trigger_func();
CREATE TRIGGER ic_trigger_set_audit_columns BEFORE INSERT OR UPDATE ON public.ic_behaviour_types_master FOR EACH ROW EXECUTE FUNCTION ic_set_audit_columns();
CREATE TRIGGER ic_update_updated_at_column BEFORE UPDATE ON public.ic_behaviour_types_master FOR EACH ROW EXECUTE FUNCTION ic_update_updated_at_column();

-- 5. RLS Policies (Standard Module RBAC)
-- Note: These policies should be added to current_database_rbac.json as well.

-- Seizure Types
CREATE POLICY "RBAC seizure_types SELECT" ON public.ic_seizure_types_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC seizure_types ALL (Admin)" ON public.ic_seizure_types_master FOR ALL TO authenticated USING (ic_jwt_is_admin());

-- Behaviour Types
CREATE POLICY "RBAC behaviour_types SELECT" ON public.ic_behaviour_types_master FOR SELECT TO authenticated USING (true);
CREATE POLICY "RBAC behaviour_types ALL (Admin)" ON public.ic_behaviour_types_master FOR ALL TO authenticated USING (ic_jwt_is_admin());
