-- Migration: Modify staff table for employment fields refactoring
-- Date: 2026-02-08
-- Purpose: Add new fields, foreign keys, and drop old text columns

-- Add new fields
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hobbies TEXT NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS allergies TEXT NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS availability TEXT NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department_id UUID NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_type_id UUID NULL;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS manager_id UUID NULL;

-- Add foreign key constraints
ALTER TABLE staff 
  DROP CONSTRAINT IF EXISTS staff_department_id_fkey;
ALTER TABLE staff 
  ADD CONSTRAINT staff_department_id_fkey 
  FOREIGN KEY (department_id) 
  REFERENCES departments(id) 
  ON DELETE SET NULL;

ALTER TABLE staff 
  DROP CONSTRAINT IF EXISTS staff_employment_type_id_fkey;
ALTER TABLE staff 
  ADD CONSTRAINT staff_employment_type_id_fkey 
  FOREIGN KEY (employment_type_id) 
  REFERENCES employment_types_master(id) 
  ON DELETE SET NULL;

-- Manager references another staff member (self-referencing FK)
ALTER TABLE staff 
  DROP CONSTRAINT IF EXISTS staff_manager_id_fkey;
ALTER TABLE staff 
  ADD CONSTRAINT staff_manager_id_fkey 
  FOREIGN KEY (manager_id) 
  REFERENCES staff(id) 
  ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_department_id ON staff(department_id);
CREATE INDEX IF NOT EXISTS idx_staff_employment_type_id ON staff(employment_type_id);
CREATE INDEX IF NOT EXISTS idx_staff_manager_id ON staff(manager_id);

-- Drop old columns (test data only, no migration needed)
ALTER TABLE staff DROP COLUMN IF EXISTS department;
ALTER TABLE staff DROP COLUMN IF EXISTS employment_type;
ALTER TABLE staff DROP COLUMN IF EXISTS working_hours;
ALTER TABLE staff DROP COLUMN IF EXISTS qualifications;
ALTER TABLE staff DROP COLUMN IF EXISTS certifications;

-- Add comments
COMMENT ON COLUMN staff.hobbies IS 'Staff member hobbies and interests';
COMMENT ON COLUMN staff.allergies IS 'Staff member allergies';
COMMENT ON COLUMN staff.availability IS 'Staff availability schedule';
COMMENT ON COLUMN staff.department_id IS 'Foreign key to departments table';
COMMENT ON COLUMN staff.employment_type_id IS 'Foreign key to employment_types_master table';
COMMENT ON COLUMN staff.manager_id IS 'Foreign key to staff table - who this staff member reports to';
