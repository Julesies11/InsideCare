-- Add side_effects and interactions fields to medications_master table
ALTER TABLE medications_master 
ADD COLUMN side_effects TEXT,
ADD COLUMN interactions TEXT;

-- Add comments for documentation
COMMENT ON COLUMN medications_master.side_effects IS 'General side effects of the medication';
COMMENT ON COLUMN medications_master.interactions IS 'Contraindication/Interactions with other medications or conditions';
