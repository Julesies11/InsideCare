# InsideCare Database Schema Overview

This document provides an overview of the core database tables and their relationships in the InsideCare application.

## Database Source of Truth
As of **May 18, 2026**, the database schema source of truth is maintained in:
- **Schema Metadata:** `migrations/schema_metadata.json` (Tables, Columns, Enums, Logic).
- **RBAC Policies:** `migrations/current_database_rbac.json` (Live RLS policy state).

**Mandatory AI Workflow:**
Before generating any SQL statements, the AI **MUST** perform a `read_file` on both JSON metadata files to verify naming conventions, data types, and existing security policies.

### Migration Naming Convention
New migrations must follow the `YYYYMMDDXX_description.sql` format:
- `YYYYMMDD`: The current date (Year, Month, Day).
- `XX`: A sequential number starting from `00` for each unique migration on that date (e.g., `00`, `01`, `02`).
- `description`: A brief, lowercase, underscore-separated description of the change.

## RBAC Access Levels (`public.access_level_enum`)
Used in `role_permissions` to define granular module access. Enforcement is performed via optimized JWT-based RLS:
- `full`: Global Read/Write.
- `context_read_write`: Domain-aware Read/Write (Locked to `assigned_houses` or `managed_staff_ids` in JWT).
- `context_read_only`: Domain-aware Read-Only.
- `read_only`: Global Read-Only.
- `none`: No access.

### Security Helpers (Postgres)
The following optimized functions are used in RLS policies to query the user's JWT metadata:
- **`jwt_is_admin()`**: Returns true if the user has global admin rights.
- **`jwt_has_house(uuid)`**: Returns true if the user is authorized for the given house.
- **`jwt_get_perm(text)`**: Returns the access level string for a specific module.
- **`jwt_manages_staff(uuid)`**: Returns true if the user manages the given staff member.

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
- **Relationships:** Belongs to a Department. Assigned to many Houses via `house_staff_assignments`.
- **Definition of "Active Staff":** A staff member is considered "Active" for a specific house only if:
    1. Their `status` in the `staff` table is exactly `'active'`.
    2. They have a record in `house_staff_assignments` for that house.
    3. The assignment record has no `end_date` OR the `end_date` is in the future.
    4. *This definition must be strictly enforced across all dropdowns, rosters, and house-linked counts.*

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
- **`house_shift_templates`**: Defines house-specific shift periods (Morning, Day, etc.) with custom icons, colors, and default times.
- **`shift_template_default_checklists`**: Junction table mapping default checklists to shift templates for automatic assignment.
- **`staff_shifts`**: Scheduled shifts for staff.
    - **Key Fields**: `id`, `staff_id`, `house_id`, `start_date`, `end_date`, `start_time`, `end_time`, `shift_template_id`, `shift_template`.
- **`shift_participants`**: Many-to-many relationship between shifts and care recipients (`participants`).
- **`shift_assigned_checklists`**: Instances of checklists assigned to a *specific* `staff_shift`.
- **Note**: Organization-level shift templates (`org_shift_templates`) have been deprecated in favor of this House-specific model for better operational flexibility.

### Checklists & Submissions
- **`checklist_master` & `checklist_item_master`**: Templates for recurring tasks.
- **`house_checklists` & `house_checklist_items`**: Checklists assigned to specific houses.
    - **Optimization**: Frequency logic has been removed from the house checklist level to support pure template-based assignment.
- **`house_checklist_submissions`**: Tracks the overall status of a checklist execution (e.g., 'in_progress', 'completed').
    - **Linking**: Submissions explicitly store `shift_id` and `shift_template_id` for compliance tracking.
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
- **`roles`**: RBAC role definitions.
- **`role_permissions`**: Granular module-by-module access levels (`access_level_enum`) linked 1:1 to roles.
- **`departments` & `branches`**: Organizational structure.

## Data Rules

- **Logic in TS**: No complex triggers or procedures in the database. Transformations and joins are handled in the React application.
- **Master Tables**: Heavy use of "Master" tables (e.g., `medications_master`, `contact_types_master`) to maintain consistent options across the system.
- **Soft Delete/Status**: Most entities use a `status` field or `is_active` flag rather than hard deletion.
- **Activity Logging**: Most `INSERT`/`UPDATE`/`DELETE` operations should be accompanied by an entry in the `activity_log`.
