-- Migration: Add is_emergency_contact to participant contacts
-- Description: Adds is_emergency_contact boolean column to ic_participant_contacts with NOT NULL DEFAULT false constraint

BEGIN;

ALTER TABLE public.ic_participant_contacts
ADD COLUMN is_emergency_contact boolean NOT NULL DEFAULT false;

COMMIT;
