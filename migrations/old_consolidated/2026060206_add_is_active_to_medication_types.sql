-- Migration: Add is_active to ic_medication_types_master
-- Description: Adds is_active column to medication types to support deactivation instead of deletion.

ALTER TABLE public.ic_medication_types_master 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update existing records to be active (though DEFAULT true handles this, being explicit)
UPDATE public.ic_medication_types_master SET is_active = true WHERE is_active IS NULL;
