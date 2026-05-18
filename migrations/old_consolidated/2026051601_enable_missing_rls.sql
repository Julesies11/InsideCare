-- Migration: Enable missing RLS
-- Description: Enables Row Level Security on tables that currently have unrestricted access.

BEGIN;

ALTER TABLE public.branch_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_calendar_event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_comms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

COMMIT;
