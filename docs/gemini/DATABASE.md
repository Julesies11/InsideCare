# InsideCare Database Schema Overview

This document provides an overview of the core database tables and their relationships in the InsideCare application.

## Database Baseline
As of **March 30, 2026**, the database schema has been refined for go-live:
- **Baseline:** `migrations/2026032000_baseline_schema.sql` (Canonical schema).
- **Security Hardening:** `migrations/2026032001_harden_rls_policies.sql` (Global RLS activation).
- **Dynamic Shift Model:** `migrations/2026032401_dynamic_shift_model.sql` (House-specific shift types).
- **Shift Template Refactor:** `migrations/2026032500_refactor_shift_templates.sql` (Flexible template groups).
- **Column Standardization:** `migrations/2026032901_rename_shift_date_to_start_date.sql` (Standardized date naming).
- **Archiving:** Historical files are in `migrations/old_consolidated/`.

## Enum Compatibility & Querying
The project uses Postgres Enums for critical columns (e.g., `public.status_enum`).
- **Restriction:** You **cannot** use `.ilike()` or pattern matching operators (`~~*`) on enum columns.
- **Rule:** Always use `.eq()` for exact matching or `.in()` for multiple values when filtering by `status` or other enum types in Supabase queries.

## Core Entities

### 1. Participants (`public.participants`)
The central entity representing the individuals receiving care.
- **Key Fields:** `id`, `name`, `email`, `house_id`, `status` (`active`, `draft`, etc.), `ndis_number`, `support_level`.
- **Relationships:** Belongs to a House (`house_id`). Has many Notes, Medications, Goals, Documents, etc.

### 2. Staff (`public.staff`)
The employees providing care.
- **Key Fields:** `id`, `name`, `email`, `role_id`, `status`, `auth_user_id` (links to Supabase Auth).
- **Relationships:** Belongs to a Department. Assigned to many Houses.

### 3. Houses (`public.houses`)
The care facilities/locations.
- **Key Fields:** `id`, `name`, `branch_id`, `capacity`, `current_occupancy`.
- **Relationships:** Belongs to a Branch. Has many Participants and Staff assignments.

## Child Entities (Participant-related)

- **`participant_medications`**: Tracks medications, dosage, and frequency. Linked to `medications_master`.
- **`participant_goals` & `participant_goal_progress`**: Tracks care goals and their progress.
- **`participant_notes`**: General and important notes about the participant.
- **`participant_documents`**: Files uploaded for the participant.
- **`participant_contacts`**: External contacts (GP, Pharmacy, Support Coordinator).
- **`participant_funding`**: Tracks NDIS or other funding sources and balances.
- **`participant_hygiene_routines`**: Specific care routines.
- **`participant_restrictive_practices`**: Compliance-critical care instructions.

## Operational Tables

### Roster & Shifts
- **`house_shift_types`**: Defines house-specific shift periods (Morning, Day, etc.) with custom icons, colors, and default times.
- **`shift_type_default_checklists`**: Junction table mapping default checklists to shift types for automatic assignment.
- **`staff_shifts`**: Scheduled shifts for staff.
    - **Key Fields**: `id`, `staff_id`, `house_id`, `start_date`, `start_time`, `end_time`, `shift_type_id`.
- **`shift_assigned_checklists`**: Instances of checklists assigned to a *specific* `staff_shift`.
- **Note**: Organization-level shift templates (`org_shift_templates`) have been deprecated in favor of this House-specific model for better operational flexibility.

### Checklists & Submissions
- **`checklist_master` & `checklist_item_master`**: Templates for recurring tasks.
- **`house_checklists` & `house_checklist_items`**: Checklists assigned to specific houses.
    - **Optimization**: Frequency logic has been removed from the house checklist level to support pure template-based assignment.
- **`house_checklist_submissions`**: Tracks the overall status of a checklist execution (e.g., 'in_progress', 'completed').
    - **Linking**: Submissions explicitly store `shift_id` and `shift_type_id` for compliance tracking.
- **`house_checklist_submission_items`**: Tracks completion of specific tasks.
    - **Attribution**: The `completed_by` column stores the `staff_id` of the individual who signed off on the task.
    - **Status**: The `status` column ('Completed' or 'Pending') indicates task state.
- **`house_checklist_item_attachments`**: Files uploaded for specific tasks during execution.

### Compliance & Training
- **`staff_compliance`**: Tracks mandatory checks (NDIS Worker Screening, etc.).
- **`staff_training`**: Records of training completed by staff.
- **`staff_documents`**: Files like ID, certificates, etc.

## System Tables

- **`activity_log`**: Audit trail for all changes in the system.
- **`roles`**: RBAC permissions for staff.
- **`departments` & `branches`**: Organizational structure.

## Data Rules

- **Logic in TS**: No complex triggers or procedures in the database. Transformations and joins are handled in the React application.
- **Master Tables**: Heavy use of "Master" tables (e.g., `medications_master`, `contact_types_master`) to maintain consistent options across the system.
- **Soft Delete/Status**: Most entities use a `status` field or `is_active` flag rather than hard deletion.
- **Activity Logging**: Most `INSERT`/`UPDATE`/`DELETE` operations should be accompanied by an entry in the `activity_log`.
