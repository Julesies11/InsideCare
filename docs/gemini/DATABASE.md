# InsideCare Database Schema Overview

This document provides an overview of the core database tables and their relationships in the InsideCare application.

## Multi-App Isolation Standard (Prefixing)
As of **May 21, 2026**, the database schema uses the `ic_` prefix for all objects to allow secure sharing of a single database instance with other applications. 
- **Tables/Enums/Functions:** `ic_` prefix required (e.g., `ic_participants`).
- **Storage Buckets:** `ic_` prefix required (e.g., `ic_staff_photos`).
- **Edge Functions:** `ic-` prefix required (e.g., `ic-invite-user`).

## Database Source of Truth
The schema source of truth is maintained in:
- **Directory:** `docs/database_schema/`
- **Schema Metadata:** `docs/database_schema/schema_metadata.json` (Tables, Columns, Enums, Logic).
- **RBAC Policies:** `docs/database_schema/current_database_rbac.json` (Live RLS policy state).
- **Storage Policies:** `docs/database_schema/storage_schema.json` (Storage RLS state).

**Mandatory AI Workflow:**
Before generating any SQL statements, the AI **MUST** perform a `read_file` on these metadata files to verify naming conventions, data types, and existing security policies.

### Security Model (Gold Standard RLS)
The project employs a **Gold Standard RLS architecture**:
1.  **Explicit Command Separation**: Policies are explicitly separated into `SELECT`, `INSERT`, `UPDATE`, and `DELETE` commands. Broad `ALL` policies for non-admin roles are strictly forbidden to ensure granular control.
2.  **Delete Restriction (Admin Only)**: All records (clinical, transactional, organizational, master lists) can **only** be deleted by global `Admin` users (defined as `full` access to `access_control`). This enforces the project-wide soft-delete architecture at the database level.
3.  **Level-Guarded Context**: House or staff-specific access is only granted if the user's permission level for that specific module is at least `context_read_only`.
4.  **Hierarchical Module Access**: Permissions are structured hierarchically:
    - **Houses**: `houses` parent with `house_management`, `house_operations`, etc., as children.
    - **Participant Records**: `participants` parent with `participant_goals`, `participant_medications`, etc., as children.
    - **Staff Profiles**: `employees` parent with `staff_compliance`, `staff_employment`, etc., as children.
    - *Enforcement*: Setting a parent to `none` ghost-locks children in the UI, but database policies are inclusive to prevent logic deadlocks.
5.  **Inclusive Entry Logic**: Application-level entry guards for complex modules (like Houses) use OR-logic. A user is granted access to a module if they have authorized access to ANY granular sub-module, ensuring they can reach the specific data they are permitted to manage.
6.  **Master List Protection**: Master List tables (e.g., `medications_master`) are restricted to users with the `master_lists` permission.
7.  **Audit Integrity**: Use of `WITH CHECK` clauses ensures that users can only insert or update records that they own or are authorized to manage (e.g., matching their own `staff_id` or `house_id`).
8.  **JWT-Driven Performance**: System performance is maintained using memory-resident `auth.jwt()` lookups via `SECURITY DEFINER` helper functions.

### Migration Naming Convention
New migrations must follow the `YYYYMMDDXX_description.sql` format:
- `YYYYMMDD`: The current date (Year, Month, Day).
- `XX`: A sequential number starting from `00` for each unique migration on that date (e.g., `00`, `01`, `02`).
- `description`: A brief, lowercase, underscore-separated description of the change.

### Schema Baselining
As of **May 26, 2026**, the database schema has been consolidated into a single baseline migration: `migrations/2026052602_baseline_schema.sql`.
- **Purpose**: Consolidates all tables, functions, triggers, enums, and storage buckets into a single starting point, including the latest RLS hardening and storage cleanup fixes.
- **RLS Policy Handling**: To maintain readability and manageable file sizes, RLS policies are **EXCLUDED** from the baseline SQL file. They are maintained as a single source of truth in `docs/database_schema/current_database_rbac.json` and must be applied manually or via a specialized deployment script.
- **Archiving**: All previous migrations have been moved to `migrations/old_consolidated/`.

## RBAC Access Levels (`public.access_level_enum`)
Used in `role_permissions` to define granular module access. Enforcement is performed via optimized JWT-based RLS:
- `full`: Global Read/Write.
- `context_read_write`: Domain-aware Read/Write (Locked to `assigned_houses` or `managed_staff_ids` in JWT).
- `context_read_only`: Domain-aware Read-Only.
- `read_only`: Global Read-Only.
- `none`: No access.

### Security Helpers (Postgres)
The following optimized functions are used in RLS policies to query the user's JWT metadata. These are prefixed with `ic_` and are `SECURITY DEFINER` to prevent recursion:
- **`ic_jwt_is_admin()`**: Returns true if the user has global admin rights.
- **`ic_jwt_has_house(uuid)`**: Returns true if the user is authorized for the given house.
- **`ic_jwt_get_perm(text)`**: Returns the access level string for a specific module.
- **`ic_jwt_get_staff_id()`**: Returns the staff UUID associated with the current user.
- **`ic_jwt_manages_staff(uuid)`**: Returns true if the user manages the given staff member.

## Enum Compatibility & Querying
The project uses Postgres Enums for critical columns (e.g., `public.status_enum`).
- **Restriction:** You **cannot** use `.ilike()` or pattern matching operators (`~~*`) on enum columns.
- **Rule:** Always use `.eq()` for exact matching or `.in()` for multiple values when filtering by `status` or other enum types in Supabase queries.

## Core Entities

### 1. Participants (`public.ic_participants`)
The central entity representing the individuals receiving care.
- **Key Fields:** `id`, `name`, `email`, `house_id`, `status` (`active`, `draft`, etc.), `ndis_number`, `support_level`.
- **Relationships:** Belongs to a House (`house_id`). Has many Notes, Medications, Goals, Documents, etc.

### 2. Medication Master (`public.ic_medications_master`)
Centralized register of all medications used in care.
- **Key Fields:** `id`, `medication_name` (UNIQUE), `category`, `common_dosages`, `side_effects`, `interactions`, `is_active`.
- **Constraint**: Enforces uniqueness on `medication_name` to ensure register integrity.

### 3. Staff (`public.ic_staff`)
The employees providing care.
- **Key Fields:** `id`, `name`, `email`, `role_id`, `status`, `auth_user_id` (links to Supabase Auth).
- **Relationships:** Belongs to a Department. Assigned to many Houses via `house_staff_assignments`.
- **Definition of "Active Staff":** A staff member is considered "Active" for a specific house only if:
    1. Their `status` in the `staff` table is exactly `'active'`.
    2. They have a record in `house_staff_assignments` for that house.
    3. The assignment record has no `end_date` OR the `end_date` is in the future.
    4. *This definition must be strictly enforced across all dropdowns, rosters, and house-linked counts.*

### 4. Houses (`public.ic_houses`)
The care facilities/locations.
- **Key Fields:** `id`, `name`, `branch_id`, `capacity`, `current_occupancy`.
- **Management Fields:** 
    - `general_house_details`: Routines, preferences, and general house rules.
    - `individuals_breakdown`: Qualitative description of each person residing in the house.
    - `participant_dynamics`: Social dynamics and interactions between participants.
    - `risk_management`: House-level risk mitigation strategies and alerts.
    - `observations`: General staff observations regarding the house environment.
- **Relationships:** Belongs to a Branch. Has many Participants and Staff assignments.

## Child Entities (Participant-related)

- **`participant_medications`**: Tracks medications and dosage. Linked to `medications_master`.
- **`participant_goals` & `participant_goal_progress`**: Tracks care goals and their progress.
- **`participant_notes`**: General and important notes about the participant.
- **`participant_documents`**: Files uploaded for the participant.
    - **Security**: Uses a granular "Direct Override > Global Baseline" permission model. The `is_restricted` column has been removed. Permissions are handled via `ic_participant_document_roles` where Admins can set specific `Edit`, `Read-only`, or `No Access` overrides for individual roles per document.
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
- **Activity Logging**: Most `INSERT`/`UPDATE`/`DELETE` operations are accompanied by an entry in the `activity_log`.
- **Automated Audit Columns**: All tables use automated triggers (`ic_trigger_set_audit_columns`) and column defaults to manage standard audit fields:
    - `created_at`: Set automatically via column default `now()`.
    - `updated_at`: Set automatically on every update via `ic_update_updated_at_column` trigger.
    - `created_by`: Set automatically on insert via `ic_set_audit_columns` trigger using `auth.uid()`.
    - `updated_by`: Set automatically on every insert or update via `ic_set_audit_columns` trigger using `auth.uid()`.
    - **Note:** Because these are handled at the database level, application code **MUST NOT** manually assign these fields in Supabase mutation calls. This ensures 100% audit coverage and prevents client-side spoofing.
