-- Add attachment_url column to leave_requests
ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS attachment_url text;

-- Storage RLS: allow authenticated staff to upload their own leave attachments
-- Uses existing 'staff-documents' bucket
CREATE POLICY "Staff can upload own leave attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'staff-documents'
    AND (storage.foldername(name))[1] = 'leave-attachments'
    AND (storage.foldername(name))[2] = (
      SELECT id::text FROM staff WHERE auth_user_id = auth.uid() LIMIT 1
    )
  );

-- Allow authenticated users to read leave attachments
CREATE POLICY "Authenticated users can read leave attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'staff-documents'
    AND (storage.foldername(name))[1] = 'leave-attachments'
  );

-- Allow staff to delete their own leave attachments
CREATE POLICY "Staff can delete own leave attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'staff-documents'
    AND (storage.foldername(name))[1] = 'leave-attachments'
    AND (storage.foldername(name))[2] = (
      SELECT id::text FROM staff WHERE auth_user_id = auth.uid() LIMIT 1
    )
  );
