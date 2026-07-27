-- Migration: Add reference_id to public.ic_incident_reports
-- 1. Add column without unique constraint initially so we can backfill
ALTER TABLE public.ic_incident_reports 
ADD COLUMN IF NOT EXISTS reference_id text;

-- 2. Backfill existing records using inline SQL for initials extraction
WITH computed_incidents AS (
  SELECT 
    ir.id,
    'INC-' || 
    to_char(ir.incident_date, 'YYYYMMDD') || '-' || 
    to_char(ir.incident_date, 'HH24MI') || '-' ||
    COALESCE(
      NULLIF(
        (
          SELECT string_agg(upper(left(token, 1)), '')
          FROM unnest(string_to_array(p.participant_name, ' ')) AS token
        ),
        ''
      ),
      'GEN'
    ) AS base_ref
  FROM public.ic_incident_reports ir
  LEFT JOIN public.ic_participants p ON ir.involved_participant_id = p.id
  WHERE ir.reference_id IS NULL
),
numbered_incidents AS (
  SELECT 
    id,
    base_ref,
    row_number() OVER(PARTITION BY base_ref ORDER BY id) as rn
  FROM computed_incidents
)
UPDATE public.ic_incident_reports ir
SET reference_id = CASE 
                     WHEN ni.rn = 1 THEN ni.base_ref
                     ELSE ni.base_ref || '-' || ni.rn
                   END
FROM numbered_incidents ni
WHERE ir.id = ni.id;

-- 3. Add UNIQUE constraint to reference_id
ALTER TABLE public.ic_incident_reports 
DROP CONSTRAINT IF EXISTS ic_incident_reports_reference_id_key;

ALTER TABLE public.ic_incident_reports 
ADD CONSTRAINT ic_incident_reports_reference_id_key UNIQUE (reference_id);
