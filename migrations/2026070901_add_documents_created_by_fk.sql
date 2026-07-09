-- Add foreign key constraints for created_by and updated_by on document-related tables to ic_staff
-- YYYYMMDD: 20260709, XX: 01

-- 1. Clean up orphans (safety measure to ensure constraints can be created)
UPDATE public.ic_participant_documents
SET created_by = NULL
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = ic_participant_documents.created_by);

UPDATE public.ic_participant_documents
SET updated_by = NULL
WHERE updated_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = ic_participant_documents.updated_by);

UPDATE public.ic_staff_documents
SET created_by = NULL
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = ic_staff_documents.created_by);

UPDATE public.ic_staff_documents
SET updated_by = NULL
WHERE updated_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = ic_staff_documents.updated_by);

UPDATE public.ic_house_files
SET created_by = NULL
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = ic_house_files.created_by);

UPDATE public.ic_house_files
SET updated_by = NULL
WHERE updated_by IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.ic_staff s WHERE s.id = ic_house_files.updated_by);

-- 2. Add foreign key constraints for created_by
ALTER TABLE public.ic_participant_documents DROP CONSTRAINT IF EXISTS fk_ic_participant_documents_created_by;
ALTER TABLE public.ic_participant_documents 
  ADD CONSTRAINT fk_ic_participant_documents_created_by 
  FOREIGN KEY (created_by) REFERENCES public.ic_staff(id) ON DELETE SET NULL;

ALTER TABLE public.ic_staff_documents DROP CONSTRAINT IF EXISTS fk_ic_staff_documents_created_by;
ALTER TABLE public.ic_staff_documents 
  ADD CONSTRAINT fk_ic_staff_documents_created_by 
  FOREIGN KEY (created_by) REFERENCES public.ic_staff(id) ON DELETE SET NULL;

ALTER TABLE public.ic_house_files DROP CONSTRAINT IF EXISTS fk_ic_house_files_created_by;
ALTER TABLE public.ic_house_files 
  ADD CONSTRAINT fk_ic_house_files_created_by 
  FOREIGN KEY (created_by) REFERENCES public.ic_staff(id) ON DELETE SET NULL;

-- 3. Add foreign key constraints for updated_by
ALTER TABLE public.ic_participant_documents DROP CONSTRAINT IF EXISTS fk_ic_participant_documents_updated_by;
ALTER TABLE public.ic_participant_documents 
  ADD CONSTRAINT fk_ic_participant_documents_updated_by 
  FOREIGN KEY (updated_by) REFERENCES public.ic_staff(id) ON DELETE SET NULL;

ALTER TABLE public.ic_staff_documents DROP CONSTRAINT IF EXISTS fk_ic_staff_documents_updated_by;
ALTER TABLE public.ic_staff_documents 
  ADD CONSTRAINT fk_ic_staff_documents_updated_by 
  FOREIGN KEY (updated_by) REFERENCES public.ic_staff(id) ON DELETE SET NULL;

ALTER TABLE public.ic_house_files DROP CONSTRAINT IF EXISTS fk_ic_house_files_updated_by;
ALTER TABLE public.ic_house_files 
  ADD CONSTRAINT fk_ic_house_files_updated_by 
  FOREIGN KEY (updated_by) REFERENCES public.ic_staff(id) ON DELETE SET NULL;
