-- Fix RLS policies for staff_documents table
-- Run this to update the policies if the table already exists

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON staff_documents;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON staff_documents;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON staff_documents;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON staff_documents;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON staff_documents;

-- Create simple policy that allows all operations
CREATE POLICY "Enable all access for authenticated users" ON staff_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);
