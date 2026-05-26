-- Remove frequency column from ic_participant_medications table
ALTER TABLE public.ic_participant_medications DROP COLUMN IF EXISTS frequency;
