-- Migration: Drop Redundant Teams Table
-- Date: 2026-05-19
-- Description: Removes the unused 'teams' table from the database.

DROP TABLE IF EXISTS public.teams;
