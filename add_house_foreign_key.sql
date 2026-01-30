-- Add foreign key constraint from participants.house_id to houses.id
-- This enables Supabase to perform joins between the tables

-- First, check if the constraint already exists and drop it if needed
ALTER TABLE participants 
DROP CONSTRAINT IF EXISTS participants_house_id_fkey;

-- Add the foreign key constraint
ALTER TABLE participants
ADD CONSTRAINT participants_house_id_fkey 
FOREIGN KEY (house_id) 
REFERENCES houses(id)
ON DELETE SET NULL  -- If a house is deleted, set house_id to NULL for participants
ON UPDATE CASCADE;  -- If house id changes, update the reference

-- Add comment to document the relationship
COMMENT ON CONSTRAINT participants_house_id_fkey ON participants 
IS 'Foreign key relationship to houses table for participant house assignment';
