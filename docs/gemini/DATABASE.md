# InsideCare Database Schema Overview

This document provides an overview of the core database tables and their relationships in the InsideCare application.

## Multi-App Isolation Standard (Prefixing)

As of **May 21, 2026**, the database schema uses the `ic_` prefix for all objects to allow secure sharing of a single database instance with other applications.

- **Tables/Enums/Functions:** `ic_` prefix required (e.g., `ic_participants`).
- **Storage Buckets:** `ic_` prefix required (e.g., `ic_staff_photos`).
- **Edge Functions:** `ic-` prefix required (e.g., `ic-invite-user`).

## Multi-Tenant (Multi-Organisation) Foundation Standard (July 2026)

As of **July 27, 2026**, the database schema implements a forward-compatible **Multi-Tenant (Multi-Organisation)** foundation:

- **`ic_organisations`**: Master tenant table (`id`, `name`, `slug`, `settings`). Default primary organisation: `'00000000-0000-0000-0000-000000000001'`.
- **`ic_staff_organisations`**: Junction table allowing staff (e.g., agency workers) to belong to multiple organisations.
- **Tenant Row Isolation**: All core entity and operational tables contain an `organisation_id` UUID column referencing `ic_organisations`.
- **Hybrid Master List Model**: Master reference tables support system-wide globals (`organisation_id IS NULL`) and tenant-customized entries (`organisation_id = active_organisation_id`).
- **Security Helper**: `public.ic_jwt_get_organisation_id()` extracts `active_organisation_id` from session JWT claims with automatic fallback.
- **Enforced RLS & Audit Triggers (July 28, 2026 - Migration `2026072800`)**:
  - `ic_set_audit_columns()` trigger automatically populates `NEW.organisation_id := public.ic_jwt_get_organisation_id()` on insert when missing or matching default fallback.
  - Active tenant RLS policies (`organisation_id = public.ic_jwt_get_organisation_id()`) are enforced on all core entity tables (`ic_houses`, `ic_staff`, `ic_participants`, `ic_incident_reports`, `ic_staff_shifts`, `ic_shift_notes`, `ic_timesheets`, `ic_staff_compliance`, `ic_leave_requests`, `ic_house_resources`, `ic_house_checklists`).
  - Edge function `ic-invite-staff-user` automatically upserts membership in `ic_staff_organisations` upon user invitation.

## Data Access Layer (DAL) Adherence

As of **May 31, 2026**, the application has achieved **100% DAL adherence** for the UI layer.

- **Centralized Access**: All database interactions are routed through `src/api/`.
- **Zero Raw Imports**: Raw `supabase` and `TABLES` imports are strictly forbidden in `src/pages`, `src/hooks`, and `src/components`.
- **Consistency**: All master data is fetched through unified `listActive` methods ensuring consistent data shapes (e.g., `name` property normalization).

## "No Legacy" Mandate (June 11, 2026)

Following a comprehensive modernization refactor, all redundant data columns and legacy synchronization paths have been eliminated.

1.  **Dynamic Name Resolution**: Child tables (e.g., `ic_staff_compliance`) **must not** store entity names (e.g., `compliance_name`). Instead, names must be resolved via master table joins in the DAL or Query Views.
2.  **Strict Integrity**: Foreign keys for core classifications must be `NOT NULL` to prevent orphaned records.
3.  **Environment Agnostic Triggers**: Database functions must use the "Auto-Discovery" pattern for Supabase URLs and keys (resolving from request headers or internal vault), ensuring portability across Dev and Prod without manual configuration.

## Database Source of Truth & Baseline

The schema source of truth is maintained in:

- **Baseline Migration:** `migrations/2026072701_baseline_schema.sql` (Consolidated schema baseline: extensions, enums, tables, FKs, functions, storage buckets, and triggers without RLS policy statements).
- **Directory:** `docs/database_schema/dev/`
- **Schema Metadata:** `docs/database_schema/dev/schema_metadata.json` (Tables, Columns, Enums, Functions, Triggers).
- **RBAC Policies:** `docs/database_schema/dev/current_database_rbac.json` (Live RLS policy state, managed separately to keep baseline migration concise).
- **Baseline Generator:** `scripts/generate_baseline.py` (Script to regenerate baseline SQL from dev metadata).

**AI Workflow:** Before generating any SQL, always audit these live metadata files.

### Security Model (Gold Standard RLS)

The project employs a **Gold Standard RLS architecture**:

1.  **Explicit Command Separation**: Policies are explicitly separated into `SELECT`, `INSERT`, `UPDATE`, and `DELETE` commands.
2.  **Delete Restriction (Admin Only)**: All records can **only** be deleted by global `Admin` users (defined as `full` access to `access_control`).
3.  **Audit Integrity**: Use of `WITH CHECK` clauses ensures that users can only insert or update records that they are authorized to manage.
4.  **JWT-Driven Performance**: Optimized memory-resident `auth.jwt()` lookups via `SECURITY DEFINER` helper functions.

## RBAC Access Levels (`public.access_level_enum`)

Used in `role_permissions` to define granular module access:

- `full`: Global Read/Write.
- `context_read_write`: Domain-aware Read/Write (Locked to `assigned_houses` or `managed_staff_ids` in JWT).
- `context_read_only`: Domain-aware Read-Only.
- `read_only`: Global Read-Only.
- `none`: No access.

## Join Hinting Standards

When performing joins in Supabase (PostgREST), ambiguity is resolved using **Column-Based Hinting** as the primary method.

1. **Column-Name Hints (Primary)**: Always use the foreign key column name as the hint.
   - _Example:_ `.select(`\*, staff:${TABLES.STAFF}!staff_id(id, staff_name)`)`
2. **Self-Join Exception**: For self-referential relationships, the column name hint is mandatory.
3. **Standard Audit Hints**: Joins on audit columns MUST use column identity (`!created_by`, `!updated_by`).

## Core Entities

### 1. Participants (`public.ic_participants`)

The individuals receiving care. Linked to a House (`house_id`).

### 2. Staff (`public.ic_staff`)

The employees providing care. Linked to many Houses via `house_staff_assignments`.

- **Definition of "Active Staff":** Status must be `'active'` AND have an active assignment with no `end_date` or a future `end_date`.

### 3. Houses (`public.ic_houses`)

The care facilities. Includes setup fields: `setup_step`, `is_configured`.

#### House Documentation & Resources (`public.ic_house_resources`)

Facility-level documentation, contacts, and guidelines.

- **Soft Delete**: Uses `is_active: boolean` to manage visibility. Inactive resources are preserved for audit purposes.
- **Attachments**: Links to private storage files.

### Attachment Deletion Pattern (Pending Changes)

When implementing attachment deletion within a "Pending Changes" workflow:
- **`oldFilePath` Standard**: Always include an `oldFilePath` property in the pending update model.
- **State Preservation**: When a user removes a file, set `file_url`/`filePath` to `null` (for UI display) but store the original path in `oldFilePath`.
- **API Sync**: The synchronization logic must check `oldFilePath` to perform the physical storage cleanup (e.g., `supabase.storage.remove()`) before updating the database record. This prevents losing the reference needed for storage cleanup when the display URL is nullified.

### 4. Operational Tables

- **`ic_shift_notes`**: Flat normalization with 75+ clinical columns.
  - **Uniqueness Logic**: As of **June 12, 2026**, the legacy `shift_notes_shift_staff_unique` constraint has been removed. Uniqueness is now enforced by the `ic_shift_notes_staff_shift_participant_active_idx` partial index, which allows **one active/draft note per staff member per shift per participant**. This enables multi-participant house shifts while preventing duplicates.
  - **Clinical Integrity Fields**: Includes specialized description columns (`mtm_texture_notes`, `mtm_consistency_notes`, `mtm_positioning_notes`, `mtm_supervision_notes`) to capture detailed clinical context when standard requirements are not met.
  - **Master List Mapping**: All clinical dropdowns (Sleep, Behaviour, Nutrition, etc.) must map to their corresponding `*_id` UUID columns. Frontend state keys must exactly match database column names to ensure persistence through unified save handlers.
- **`ic_staff_shifts`**: Scheduled work periods.
- **`ic_house_checklists`**: Facility and shift routines.
- **`ic_timesheets`**: Tracked actual hours vs rostered.
- **`ic_incident_reports`**: Structured incident reporting with NDIS and Restrictive Practice support.
  - **Refactored Architecture**: As of **June 4, 2026**, moved to a fully structured schema using `incident_type_id`, `summary`, and `details`. Legacy columns (`incident_type`, `description`, `status`) are preserved as nullable for backward compatibility.
  - **Incident Reference ID**: As of **June 8, 2026**, introduced a unique `reference_id` column. Formatted as `INC-YYYYMMDD-HHMM-[Participant Initials]` (e.g., `INC-20260608-2044-JG`) to match the shift note pattern, auto-computed on lodging and backfilled.
  - **RBAC Guarded**: Admin-only fields (`admin_status`, `admin_actions_taken`, `ndis_reported_date`) are protected via column-level checks in the application and hardened RLS policies.

### 5. Automated Audit Columns & Gold Standard Auditing (July 31, 2026)

All operational and domain tables use a unified, hardened dual-trigger architecture (`ic_trigger_set_audit_columns` and `ic_trigger_audit_log`):

- **Audit Column Attribution (`ic_set_audit_columns`)**:
  - Automatically populates `created_at`, `updated_at`, `created_by`, `updated_by`, and `organisation_id` via `ic_jwt_get_staff_id()` and `ic_jwt_get_organisation_id()`.
  - **Immutability**: Preserves `created_at`, `created_by`, and `organisation_id` on updates.
- **Universal Activity Logging (`ic_audit_trigger_func`)**:
  - Automatically captures all `INSERT` (`create`), `UPDATE` (`update`), and `DELETE` (`delete`) operations across 100% of tables dynamically discovered via `information_schema.tables`.
  - **Request Context**: Captures client IP address (`x-forwarded-for`/`cf-connecting-ip`) and `user-agent` from Supabase HTTP headers in `metadata->'request_meta'`.
  - **Smart Aggregate Root Resolution**: Automatically resolves parent entities (`Participant`, `Staff`, or `House`) and populates `parent_id`, `parent_type`, and `parent_name`.
  - **Field-Level Diffing**: Captures exact field transitions in `metadata->'changes'`, ignoring non-functional timestamp and user identity audit noise.
  - **Append-Only Security**: `ic_activity_log` operates under strict append-only RLS security (SELECT permitted for authorized tenant users; UPDATE and DELETE disallowed).
  - **Zero Frontend Duplication**: Activity logging is 100% database-driven; client-side mutation hooks must not execute explicit secondary log insertions.

### 6. Master Lists & Deactivation Standard

To preserve data integrity and historical clinical records, the application follows a **"Deactivate, Don't Delete"** pattern for master list items.

- **Global Read Access**: As of **June 12, 2026**, all Master and Lookup tables (e.g., Leave Types, Clinical Scales, Departments) are **globally readable** by any authenticated staff member (`SELECT TO authenticated USING (true)`). This ensures that dropdowns always work for staff members in their daily tasks (Shift Notes, Leave Requests) even if they do not have the `master_lists` management permission.
- **`ic_medication_types_master`**: Lookup table for medication categories.
- **`ic_incident_types_master`**: NDIS-compliant incident classifications.
- **`ic_restrictive_practice_types_master`**: Standard restrictive practice categories.
  - `is_active`: Boolean (Default: true). Deactivating a type hides it from new selections but preserves existing clinical records.
- **Implementation**: API methods must support `includeInactive` filters, and UI components must implement **Contextual Filtering** (showing active types plus the currently assigned inactive type during editing).

### 7. Compliance & ID Verification

- **`ic_compliance_types_master`**: Master list of compliance checks.
  - `attachment_applicable`: Boolean toggle to show/hide file attachment uploader.
  - `expiry_date_applicable`: Toggle to show/hide expiry date input.
  - `document_number_applicable`: Toggle to show/hide document number input.
  - `comments_applicable`: Toggle to show/hide comments textarea.
- **`ic_id_document_types`**: Configurable identification document types for 100-point checks.
  - Fields: `name`, `category` (primary/secondary), `points`, `expiry_required`, `placeholder`.
- **`ic_compliance_status_enum`**: Standardized statuses for requirement tracking: `complete`, `in_progress`, `not_applicable`.
- **`ic_staff_compliance`**: Staff-specific compliance records. Uses `ic_compliance_status_enum` for precise state tracking.
- **`ic_staff_compliance_documents`**: Junction table for multi-document verification (e.g., 100 points of ID) and standard compliance attachments.
