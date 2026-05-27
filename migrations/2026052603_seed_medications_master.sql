-- Migration: Harden and Seed Medications Master List
-- Created: 2026-05-26
-- Description: Adds unique constraint to medication_name and imports the baseline list of medications.

-- 1. Harden Schema: Ensure medication names are unique
-- Check for any duplicates and remove them if they exist
DELETE FROM public.ic_medications_master a USING (
    SELECT MIN(id::text) as min_id_text, medication_name 
    FROM public.ic_medications_master 
    GROUP BY medication_name 
    HAVING COUNT(*) > 1
) b
WHERE a.medication_name = b.medication_name 
AND a.id::text <> b.min_id_text;

-- Add the unique constraint if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ic_medications_master_medication_name_unique'
    ) THEN
        ALTER TABLE public.ic_medications_master 
        ADD CONSTRAINT ic_medications_master_medication_name_unique UNIQUE (medication_name);
    END IF;
END $$;

-- 2. Seed Data: Import the baseline list
INSERT INTO public.ic_medications_master (medication_name, category, common_dosages, is_active)
VALUES
  ('Paracetamol', 'Pain', '500mg, 1000mg', true),
  ('Lamotrigine', 'Mood Stabilizer', '25mg, 50mg, 100mg, 200mg', true),
  ('Citalopram', 'Antidepressant', '10mg, 20mg, 40mg', true),
  ('Alprazolam', 'Anxiolytic', '0.25mg, 0.5mg, 1mg, 2mg', true),
  ('Escitalopram', 'Antidepressant', '5mg, 10mg, 20mg', true),
  ('Aripiprazole', 'Antipsychotic', '5mg, 10mg, 15mg, 20mg, 30mg', true),
  ('Clonazepam', 'Anxiolytic', '0.5mg, 1mg, 2mg', true),
  ('Mirtazapine', 'Antidepressant', '15mg, 30mg, 45mg', true),
  ('Clozapine', 'Antipsychotic', '25mg, 50mg, 100mg, 200mg', true),
  ('Venlafaxine', 'Antidepressant', '37.5mg, 75mg, 150mg, 225mg', true),
  ('Paroxetine', 'Antidepressant', '10mg, 20mg, 30mg, 40mg', true),
  ('Diazepam', 'Anxiolytic', '2mg, 5mg, 10mg', true),
  ('Lithium Carbonate', 'Mood Stabilizer', '250mg, 400mg, 450mg', true),
  ('Lorazepam', 'Anxiolytic', '0.5mg, 1mg, 2mg', true),
  ('Risperidone', 'Antipsychotic', '0.5mg, 1mg, 2mg, 3mg, 4mg', true),
  ('Sertraline', 'Antidepressant', '25mg, 50mg, 100mg, 150mg, 200mg', true),
  ('Sodium Valproate', 'Mood Stabilizer', '200mg, 500mg, 1000mg', true),
  ('Olanzapine', 'Antipsychotic', '2.5mg, 5mg, 10mg, 15mg, 20mg', true),
  ('Fluoxetine', 'Antidepressant', '10mg, 20mg, 40mg, 60mg', true),
  ('Haloperidol', 'Antipsychotic', '0.5mg, 1mg, 2mg, 5mg, 10mg', true),
  ('Quetiapine', 'Antipsychotic', '25mg, 50mg, 100mg, 200mg, 300mg', true),
  ('Carbamazepine', 'Mood Stabilizer', '100mg, 200mg, 400mg', true)
ON CONFLICT (medication_name) 
DO UPDATE SET 
  category = EXCLUDED.category,
  common_dosages = EXCLUDED.common_dosages,
  is_active = true,
  updated_at = now();
