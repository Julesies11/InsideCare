-- Add photo_url column to participants table
-- This stores the URL/path to the participant's avatar image

ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN participants.photo_url IS 'URL or path to participant avatar/photo image';
