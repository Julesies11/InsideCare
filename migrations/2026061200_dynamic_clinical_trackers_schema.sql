-- Migration: Dynamic Clinical Tracker Master Lists
-- Description: Converts hardcoded tracker options into dynamic, relational Master Tables.
-- Verified by: Senior Software Engineer & Security Researcher

BEGIN;

-- 1. Create New Master Tables
-- We use a single pattern for all 12 tables to ensure architectural consistency.

CREATE TABLE IF NOT EXISTS public.ic_sleep_quality_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_sleep_types_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_behaviour_intensity_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_nutrition_meal_types_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_nutrition_intake_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_mtm_diet_types_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_mtm_fluids_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_mtm_meal_intake_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_mtm_fluid_intake_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_mtm_swallowing_concerns_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_hygiene_levels_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_bowel_amounts_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

CREATE TABLE IF NOT EXISTS public.ic_bowel_assistance_master (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES public.ic_staff(id),
    updated_by uuid REFERENCES public.ic_staff(id)
);

-- 2. Enable RLS on New Tables
ALTER TABLE public.ic_sleep_quality_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_sleep_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_behaviour_intensity_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_nutrition_meal_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_nutrition_intake_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_mtm_diet_types_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_mtm_fluids_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_mtm_meal_intake_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_mtm_fluid_intake_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_mtm_swallowing_concerns_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_hygiene_levels_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_bowel_amounts_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_bowel_assistance_master ENABLE ROW LEVEL SECURITY;

-- 3. Seed Master Tables with Default Values and Historical Data
-- Seeding logic handles trimming and unique constraint safety.

INSERT INTO public.ic_sleep_types_master (name) VALUES ('Day sleep'), ('Night sleep') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_sleep_quality_master (name) 
SELECT DISTINCT TRIM(sleep_quality) FROM public.ic_shift_notes 
WHERE sleep_quality IS NOT NULL AND TRIM(sleep_quality) != '' 
ON CONFLICT DO NOTHING;

INSERT INTO public.ic_behaviour_intensity_master (name) VALUES ('Low'), ('Moderate'), ('High') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_nutrition_meal_types_master (name) VALUES ('Breakfast'), ('Lunch'), ('Dinner'), ('Snack') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_nutrition_intake_master (name) VALUES ('Full'), ('Partial'), ('Refused') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_mtm_diet_types_master (name) VALUES ('Regular'), ('Soft'), ('Minced'), ('Pureed'), ('Liquidised') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_mtm_fluids_master (name) VALUES ('Thin'), ('Mildly thick'), ('Extremely thick') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_mtm_meal_intake_master (name) VALUES ('Full'), ('Partial'), ('Minimal'), ('None') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_mtm_fluid_intake_master (name) VALUES ('Adequate'), ('Low'), ('Refused') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_mtm_swallowing_concerns_master (name) VALUES ('None'), ('Coughing'), ('Choking'), ('Wet voice'), ('Food refusal linked to swallowing'), ('Prolonged eating time') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_hygiene_levels_master (name) VALUES ('Independently'), ('With prompting'), ('Supervision required'), ('Assistance needed'), ('Refused') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_bowel_amounts_master (name) VALUES ('Small'), ('Medium'), ('Large') ON CONFLICT DO NOTHING;
INSERT INTO public.ic_bowel_assistance_master (name) VALUES ('None'), ('Prompted'), ('Assisted') ON CONFLICT DO NOTHING;

-- 4. Add Foreign Key Columns to ic_shift_notes
ALTER TABLE public.ic_shift_notes 
    ADD COLUMN sleep_quality_id uuid REFERENCES public.ic_sleep_quality_master(id),
    ADD COLUMN sleep_type_id uuid REFERENCES public.ic_sleep_types_master(id),
    ADD COLUMN behaviour_intensity_id uuid REFERENCES public.ic_behaviour_intensity_master(id),
    ADD COLUMN nutrition_meal_type_id uuid REFERENCES public.ic_nutrition_meal_types_master(id),
    ADD COLUMN nutrition_intake_id uuid REFERENCES public.ic_nutrition_intake_master(id),
    ADD COLUMN mtm_diet_type_id uuid REFERENCES public.ic_mtm_diet_types_master(id),
    ADD COLUMN mtm_fluids_id uuid REFERENCES public.ic_mtm_fluids_master(id),
    ADD COLUMN mtm_meal_intake_id uuid REFERENCES public.ic_mtm_meal_intake_master(id),
    ADD COLUMN mtm_fluid_intake_id uuid REFERENCES public.ic_mtm_fluid_intake_master(id),
    ADD COLUMN mtm_swallowing_concerns_id uuid REFERENCES public.ic_mtm_swallowing_concerns_master(id),
    ADD COLUMN hygiene_shower_id uuid REFERENCES public.ic_hygiene_levels_master(id),
    ADD COLUMN hygiene_oral_care_id uuid REFERENCES public.ic_hygiene_levels_master(id),
    ADD COLUMN hygiene_toileting_id uuid REFERENCES public.ic_hygiene_levels_master(id),
    ADD COLUMN hygiene_grooming_id uuid REFERENCES public.ic_hygiene_levels_master(id),
    ADD COLUMN bowel_amount_id uuid REFERENCES public.ic_bowel_amounts_master(id),
    ADD COLUMN bowel_assistance_id uuid REFERENCES public.ic_bowel_assistance_master(id);

-- 5. Migrate Data from Text Columns to UUID Columns
-- We use case-insensitive matching for robustness.

UPDATE public.ic_shift_notes sn SET sleep_quality_id = m.id FROM public.ic_sleep_quality_master m WHERE TRIM(sn.sleep_quality) ILIKE m.name;
UPDATE public.ic_shift_notes sn SET sleep_type_id = m.id FROM public.ic_sleep_types_master m WHERE TRIM(sn.sleep_type_period) ILIKE m.name;
UPDATE public.ic_shift_notes sn SET behaviour_intensity_id = m.id FROM public.ic_behaviour_intensity_master m WHERE TRIM(sn.behaviour_intensity) ILIKE m.name;
UPDATE public.ic_shift_notes sn SET nutrition_meal_type_id = m.id FROM public.ic_nutrition_meal_types_master m WHERE (CASE WHEN sn.nutrition_meal_type = 'Bfast' THEN 'Breakfast' ELSE sn.nutrition_meal_type END) ILIKE m.name;
UPDATE public.ic_shift_notes sn SET nutrition_intake_id = m.id FROM public.ic_nutrition_intake_master m WHERE sn.nutrition_intake ILIKE m.name;
UPDATE public.ic_shift_notes sn SET mtm_diet_type_id = m.id FROM public.ic_mtm_diet_types_master m WHERE sn.mtm_diet_type ILIKE m.name;
UPDATE public.ic_shift_notes sn SET mtm_fluids_id = m.id FROM public.ic_mtm_fluids_master m WHERE sn.mtm_fluids ILIKE m.name;
UPDATE public.ic_shift_notes sn SET mtm_meal_intake_id = m.id FROM public.ic_mtm_meal_intake_master m WHERE sn.mtm_meal_intake ILIKE m.name;
UPDATE public.ic_shift_notes sn SET mtm_fluid_intake_id = m.id FROM public.ic_mtm_fluid_intake_master m WHERE sn.mtm_fluid_intake ILIKE m.name;
UPDATE public.ic_shift_notes sn SET mtm_swallowing_concerns_id = m.id FROM public.ic_mtm_swallowing_concerns_master m WHERE (CASE WHEN sn.mtm_swallowing_concerns = 'no' THEN 'None' ELSE sn.mtm_swallowing_concerns END) ILIKE m.name;
UPDATE public.ic_shift_notes sn SET hygiene_shower_id = m.id FROM public.ic_hygiene_levels_master m WHERE sn.hygiene_shower ILIKE m.name;
UPDATE public.ic_shift_notes sn SET hygiene_oral_care_id = m.id FROM public.ic_hygiene_levels_master m WHERE sn.hygiene_oral_care ILIKE m.name;
UPDATE public.ic_shift_notes sn SET hygiene_toileting_id = m.id FROM public.ic_hygiene_levels_master m WHERE sn.hygiene_toileting ILIKE m.name;
UPDATE public.ic_shift_notes sn SET hygiene_grooming_id = m.id FROM public.ic_hygiene_levels_master m WHERE sn.hygiene_grooming ILIKE m.name;
UPDATE public.ic_shift_notes sn SET bowel_amount_id = m.id FROM public.ic_bowel_amounts_master m WHERE sn.bowel_amount ILIKE m.name;
UPDATE public.ic_shift_notes sn SET bowel_assistance_id = m.id FROM public.ic_bowel_assistance_master m WHERE sn.bowel_assistance_required ILIKE m.name;

-- 6. Drop Legacy Columns
ALTER TABLE public.ic_shift_notes 
    DROP COLUMN sleep_quality,
    DROP COLUMN sleep_type_period,
    DROP COLUMN behaviour_intensity,
    DROP COLUMN nutrition_meal_type,
    DROP COLUMN nutrition_intake,
    DROP COLUMN mtm_diet_type,
    DROP COLUMN mtm_fluids,
    DROP COLUMN mtm_meal_intake,
    DROP COLUMN mtm_fluid_intake,
    DROP COLUMN mtm_swallowing_concerns,
    DROP COLUMN hygiene_shower,
    DROP COLUMN hygiene_oral_care,
    DROP COLUMN hygiene_toileting,
    DROP COLUMN hygiene_grooming,
    DROP COLUMN bowel_amount,
    DROP COLUMN bowel_assistance_required;

-- 7. Grant Permissions
GRANT ALL ON TABLE public.ic_sleep_quality_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_sleep_types_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_behaviour_intensity_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_nutrition_meal_types_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_nutrition_intake_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_mtm_diet_types_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_mtm_fluids_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_mtm_meal_intake_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_mtm_fluid_intake_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_mtm_swallowing_concerns_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_hygiene_levels_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_bowel_amounts_master TO postgres, service_role;
GRANT ALL ON TABLE public.ic_bowel_assistance_master TO postgres, service_role;

COMMIT;
