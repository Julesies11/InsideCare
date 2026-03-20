-- Migration: Create staff_documents table
-- Date: 2026-02-09
-- Purpose: Store document metadata for staff members

CREATE TABLE IF NOT EXISTS staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by TEXT,
  is_restricted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_documents_staff_id ON staff_documents(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_documents_created_at ON staff_documents(created_at DESC);

-- Add comments
COMMENT ON TABLE staff_documents IS 'Stores document metadata for staff members';
COMMENT ON COLUMN staff_documents.staff_id IS 'Foreign key to staff table';
COMMENT ON COLUMN staff_documents.file_name IS 'Original filename of the uploaded document';
COMMENT ON COLUMN staff_documents.file_path IS 'Storage path in Supabase storage bucket';
COMMENT ON COLUMN staff_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN staff_documents.mime_type IS 'MIME type of the document';
COMMENT ON COLUMN staff_documents.uploaded_by IS 'Username of the person who uploaded the document';
COMMENT ON COLUMN staff_documents.is_restricted IS 'Whether the document has restricted access';

-- Enable RLS
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - allow all operations for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON staff_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);
