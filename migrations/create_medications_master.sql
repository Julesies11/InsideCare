-- Migration: Create medications_master table
-- Date: 2026-02-05
-- Purpose: Store master list of medications for searchable dropdown

-- Create medications_master table
CREATE TABLE medications_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  common_dosages TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_medications_master_name ON medications_master(name);
CREATE INDEX idx_medications_master_active ON medications_master(is_active);
CREATE INDEX idx_medications_master_category ON medications_master(category);

-- Enable Row Level Security
ALTER TABLE medications_master ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (all users can add/edit/delete)
CREATE POLICY "Enable all access for authenticated users" ON medications_master
  FOR ALL USING (true);

-- Add comments for documentation
COMMENT ON TABLE medications_master IS 'Master list of medications for searchable dropdown';
COMMENT ON COLUMN medications_master.name IS 'Medication name (unique)';
COMMENT ON COLUMN medications_master.category IS 'Medication category for grouping';
COMMENT ON COLUMN medications_master.common_dosages IS 'Array of common dosage options';
COMMENT ON COLUMN medications_master.is_active IS 'Whether medication is active in dropdown';
COMMENT ON COLUMN medications_master.created_by IS 'User who created the medication';
COMMENT ON COLUMN medications_master.updated_by IS 'User who last updated the medication';

-- Seed common medications
INSERT INTO medications_master (name, category, common_dosages) VALUES
  -- Antipsychotics
  ('Risperidone', 'Antipsychotic', '0.5mg, 1mg, 2mg, 3mg, 4mg'),
  ('Olanzapine', 'Antipsychotic', '2.5mg, 5mg, 10mg, 15mg, 20mg'),
  ('Quetiapine', 'Antipsychotic', '25mg, 50mg, 100mg, 200mg, 300mg'),
  ('Aripiprazole', 'Antipsychotic', '5mg, 10mg, 15mg, 20mg, 30mg'),
  ('Clozapine', 'Antipsychotic', '25mg, 50mg, 100mg, 200mg'),
  ('Haloperidol', 'Antipsychotic', '0.5mg, 1mg, 2mg, 5mg, 10mg'),
  
  -- Antidepressants
  ('Sertraline', 'Antidepressant', '25mg, 50mg, 100mg, 150mg, 200mg'),
  ('Fluoxetine', 'Antidepressant', '10mg, 20mg, 40mg, 60mg'),
  ('Escitalopram', 'Antidepressant', '5mg, 10mg, 20mg'),
  ('Venlafaxine', 'Antidepressant', '37.5mg, 75mg, 150mg, 225mg'),
  ('Citalopram', 'Antidepressant', '10mg, 20mg, 40mg'),
  ('Paroxetine', 'Antidepressant', '10mg, 20mg, 30mg, 40mg'),
  ('Mirtazapine', 'Antidepressant', '15mg, 30mg, 45mg'),
  
  -- Anxiolytics
  ('Lorazepam', 'Anxiolytic', '0.5mg, 1mg, 2mg'),
  ('Diazepam', 'Anxiolytic', '2mg, 5mg, 10mg'),
  ('Clonazepam', 'Anxiolytic', '0.5mg, 1mg, 2mg'),
  ('Alprazolam', 'Anxiolytic', '0.25mg, 0.5mg, 1mg, 2mg'),
  
  -- Mood Stabilizers
  ('Sodium Valproate', 'Mood Stabilizer', '200mg, 500mg, 1000mg'),
  ('Lithium Carbonate', 'Mood Stabilizer', '250mg, 400mg, 450mg'),
  ('Lamotrigine', 'Mood Stabilizer', '25mg, 50mg, 100mg, 200mg'),
  ('Carbamazepine', 'Mood Stabilizer', '100mg, 200mg, 400mg'),
  
  -- Pain Relief
  ('Paracetamol', 'Pain', '500mg, 1000mg');
