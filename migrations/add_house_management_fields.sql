-- Migration: Add house management fields to houses table
-- Purpose: Store qualitative data about the house dynamics and participants

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'individuals_breakdown') THEN
    ALTER TABLE public.houses ADD COLUMN individuals_breakdown TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'participant_dynamics') THEN
    ALTER TABLE public.houses ADD COLUMN participant_dynamics TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'observations') THEN
    ALTER TABLE public.houses ADD COLUMN observations TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'houses' AND column_name = 'general_house_details') THEN
    ALTER TABLE public.houses ADD COLUMN general_house_details TEXT;
  END IF;
END $$;

COMMENT ON COLUMN public.houses.individuals_breakdown IS 'Breakdown of individuals living in the house';
COMMENT ON COLUMN public.houses.participant_dynamics IS 'Qualitative description of dynamics between participants';
COMMENT ON COLUMN public.houses.observations IS 'Qualitative observations about the house and participants';
COMMENT ON COLUMN public.houses.general_house_details IS 'General qualitative house details (e.g., lights on at night, specific routines)';
