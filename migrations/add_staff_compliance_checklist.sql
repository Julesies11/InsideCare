-- Migration: Add compliance checklist fields to staff table
-- Date: 2026-02-09
-- Purpose: Replace staff_compliance table with direct columns on staff table for checklist items

-- Add compliance checklist columns to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS ndis_worker_screening_check BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS ndis_worker_screening_check_expiry DATE;

ALTER TABLE staff ADD COLUMN IF NOT EXISTS ndis_orientation_module BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS ndis_orientation_module_expiry DATE;

ALTER TABLE staff ADD COLUMN IF NOT EXISTS ndis_code_of_conduct BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS ndis_code_of_conduct_expiry DATE;

ALTER TABLE staff ADD COLUMN IF NOT EXISTS ndis_infection_control_training BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS ndis_infection_control_training_expiry DATE;

ALTER TABLE staff ADD COLUMN IF NOT EXISTS drivers_license BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS drivers_license_expiry DATE;

ALTER TABLE staff ADD COLUMN IF NOT EXISTS comprehensive_car_insurance BOOLEAN DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS comprehensive_car_insurance_expiry DATE;

-- Add comments for documentation
COMMENT ON COLUMN staff.ndis_worker_screening_check IS 'Whether NDIS Worker Screening Check is completed';
COMMENT ON COLUMN staff.ndis_worker_screening_check_expiry IS 'Expiry date for NDIS Worker Screening Check';

COMMENT ON COLUMN staff.ndis_orientation_module IS 'Whether NDIS Orientation Module is completed';
COMMENT ON COLUMN staff.ndis_orientation_module_expiry IS 'Expiry date for NDIS Orientation Module';

COMMENT ON COLUMN staff.ndis_code_of_conduct IS 'Whether NDIS Code of Conduct is completed';
COMMENT ON COLUMN staff.ndis_code_of_conduct_expiry IS 'Expiry date for NDIS Code of Conduct';

COMMENT ON COLUMN staff.ndis_infection_control_training IS 'Whether NDIS Infection Control Training is completed';
COMMENT ON COLUMN staff.ndis_infection_control_training_expiry IS 'Expiry date for NDIS Infection Control Training';

COMMENT ON COLUMN staff.drivers_license IS 'Whether Drivers License is valid';
COMMENT ON COLUMN staff.drivers_license_expiry IS 'Expiry date for Drivers License';

COMMENT ON COLUMN staff.comprehensive_car_insurance IS 'Whether Comprehensive Car Insurance is valid';
COMMENT ON COLUMN staff.comprehensive_car_insurance_expiry IS 'Expiry date for Comprehensive Car Insurance';
