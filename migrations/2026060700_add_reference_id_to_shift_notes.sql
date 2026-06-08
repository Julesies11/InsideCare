-- Migration: Add reference_id to public.ic_shift_notes
-- 1. Add column without unique constraint initially so we can backfill
ALTER TABLE public.ic_shift_notes 
ADD COLUMN IF NOT EXISTS reference_id text;

-- 2. Backfill existing records using inline SQL for initials extraction
-- Query 2.1: Update notes WITH participant (handles duplicates using row_number)
WITH computed_notes AS (
  SELECT 
    sn.id,
    'SC-' || 
    to_char(sn.start_date, 'YYYYMMDD') || '-' || 
    replace(substring(coalesce(sn.shift_time, '00:00') from 1 for 5), ':', '') || '-' ||
    COALESCE(
      NULLIF(
        (
          SELECT string_agg(upper(left(token, 1)), '')
          FROM unnest(string_to_array(p.participant_name, ' ')) AS token
        ),
        ''
      ),
      'XX'
    ) AS base_ref
  FROM public.ic_shift_notes sn
  JOIN public.ic_participants p ON sn.participant_id = p.id
  WHERE sn.reference_id IS NULL
),
numbered_notes AS (
  SELECT 
    id,
    base_ref,
    row_number() OVER(PARTITION BY base_ref ORDER BY id) as rn
  FROM computed_notes
)
UPDATE public.ic_shift_notes sn
SET reference_id = CASE 
                     WHEN nn.rn = 1 THEN nn.base_ref
                     ELSE nn.base_ref || '-' || nn.rn
                   END
FROM numbered_notes nn
WHERE sn.id = nn.id;

-- Query 2.2: Update notes WITHOUT participant (General House Notes, handles duplicates using row_number)
WITH computed_house_notes AS (
  SELECT 
    sn.id,
    'SC-' || 
    to_char(sn.start_date, 'YYYYMMDD') || '-' || 
    replace(substring(coalesce(sn.shift_time, '00:00') from 1 for 5), ':', '') || '-GH' AS base_ref
  FROM public.ic_shift_notes sn
  WHERE sn.participant_id IS NULL 
    AND sn.reference_id IS NULL
),
numbered_house_notes AS (
  SELECT 
    id,
    base_ref,
    row_number() OVER(PARTITION BY base_ref ORDER BY id) as rn
  FROM computed_house_notes
)
UPDATE public.ic_shift_notes sn
SET reference_id = CASE 
                     WHEN nhn.rn = 1 THEN nhn.base_ref
                     ELSE nhn.base_ref || '-' || nhn.rn
                   END
FROM numbered_house_notes nhn
WHERE sn.id = nhn.id;

-- 3. Add UNIQUE constraint to reference_id
ALTER TABLE public.ic_shift_notes 
DROP CONSTRAINT IF EXISTS ic_shift_notes_reference_id_key;

ALTER TABLE public.ic_shift_notes 
ADD CONSTRAINT ic_shift_notes_reference_id_key UNIQUE (reference_id);
