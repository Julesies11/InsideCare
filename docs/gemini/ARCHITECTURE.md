# InsideCare Application Architecture

This document describes the architectural patterns and state management strategies used in the InsideCare application.

## 1. Backend + Supabase Logic Rules
**All complex business logic should be implemented in testable environments.**

1.  **Supabase Client**: Use `@supabase/ssr` (via `createBrowserClient`) for robust session management and cookie-based persistence.
2.  **Auth Security**: Always use `supabase.auth.getUser()` for authorization checks to ensure the JWT is verified by the Supabase server.
3.  **Edge Functions (Preferred for Backend Logic)**: Supabase Edge Functions are permitted and encouraged for complex business logic, transactional operations, and security-sensitive tasks. They must be unit-tested using Deno's native testing framework or compatible Vitest configurations.
4.  **No SQL-Based Logic**: Do NOT create Supabase SQL functions, triggers, stored procedures, RPC endpoints, or views for business logic. These are restricted because they cannot be easily unit-tested or version-controlled as part of the application's testing suite.
5.  **Client-Side Transforms**: While Edge Functions are preferred for heavy lifting, lightweight data transformations, joins, and aggregations can still be performed within the React app for immediate UI responsiveness.
6.  **Enum Querying**: Enum columns (like `status`) do NOT support `.ilike()`. Always use `.eq()` or `.in()` for these fields.

## 2. Security & Row Level Security (RLS)
The application enforces strict role-based access control (RBAC) via a normalized permissions model and Supabase RLS.

### 2.1 Granular RBAC (JWT-Based High Performance)
As of **May 18, 2026**, the system uses a high-performance RBAC model enforced via **JWT Metadata Injection** and lightweight RLS. 

**Metadata-First SQL Generation:**
To maintain system integrity, any modifications to RLS policies or RBAC logic must be preceded by an audit of `migrations/schema_metadata.json` and `migrations/current_database_rbac.json`.
- **Application-Driven Claims**: Permission calculation is handled by a TypeScript Supabase Edge Function (`ic-update-user-permissions`). This function aggregates a user's role, house assignments, and managed staff.
- **JWT Metadata**: The calculated access profile is injected directly into the user's Supabase Auth `app_metadata`. This includes:
    - `permissions`: A JSON object of module-specific access levels (e.g., `{"participants": "context_read_write"}`).
    - `assigned_houses`: An array of House UUIDs the user is authorized to access.
    - `managed_staff_ids`: An array of Staff UUIDs for direct reports.
- **Lightweight RLS**: Database Row Level Security is simplified to perform fast, memory-resident JSON lookups on the `auth.jwt()` instead of expensive multi-table joins.
    - **`jwt_has_house(house_id)`**: Instant check if the house ID exists in the user's token.
    - **`jwt_get_perm(module)`**: Instant retrieval of the authorized access level for a specific module.
- **Granular Operation Policies (Gold Standard)**: 
    - The application explicitly separates `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies to prevent permissive bypasses.
    - **Delete Protection**: `DELETE` access is strictly reserved for the `Admin` role (users with `full` access to `access_control`) for all tables, supporting a project-wide soft-delete architecture.
    - **Level-Guarded Context**: House-specific access is strictly guarded by the user's permission level. Being assigned to a house is not sufficient; the user must also possess at least `context_read_only` for the specific module to access the data.
    - **Explicit Validation**: All mutations (`INSERT`/`UPDATE`) use `WITH CHECK` clauses to ensure data integrity and prevent unauthorized record creation.
- **Access Levels**:
    - `full`: Global access to all records.
    - `context_read_write`: Domain-aware read/write access (locked to `assigned_houses` or `managed_staff_ids`).
    - `context_read_only`: Domain-aware read-only access.
    - `read_only`: Global view access without modification.
    - `none`: Hidden and blocked.

### 2.2 Dynamic & Database-Driven RBAC
To ensure system flexibility, the RBAC model strictly forbids hard-coding of role identities.

1.  **Role Agnosticism**: Roles must never be identified by name (e.g., `'Admin'`) in application logic or Edge Functions. Roles are managed exclusively via the `roles` table.
2.  **Permission-Based Authorization**: Authorization checks must be performed against specific module permissions in the `role_permissions` table.
- **Defining "Admin"**: In the context of system-wide administrative actions (e.g., syncing all user permissions, updating roles), a user is considered an **Admin** if and only if their assigned role has `'full'` access to the `access_control` module.

### 2.3 Data Access Layer (DAL) & API Architecture
As of **May 30, 2026**, the application implements a centralized Data Access Layer (DAL) located in `src/api/`. This architecture decouples UI components from raw Supabase implementation details, significantly enhancing maintainability.

- **Status: 100% Migrated (May 2026)**
- **Domain-Specific API Suite**: Raw `supabase.from()` calls are strictly forbidden in UI components. All data operations must be performed via domain-specific API modules (e.g., `participantsApi`, `staffApi`, `housesApi`, `rosterApi`).
- **Standardized Query Views**: All Supabase `.select()` strings are centralized in `src/config/query-views.ts`, ensuring entity consistency across the application.
- **Explicit Join Hinting**: ALL joins in query views must use **Column-Based Hinting** (e.g., `!created_by`) to ensure robust relationship resolution.
- **Real-time Abstraction**: Real-time subscriptions and channel management are abstracted into API methods (e.g., `systemApi.notifications.subscribe`), removing direct dependencies on `supabase.channel` from components.
- **Data Normalization**: API methods are responsible for flattening complex joins and normalizing data shapes (e.g., `listActive` methods) to ensure a consistent interface for the UI.

## 3. State Management
The application uses a combination of local state, TanStack Query, and Context Providers for efficient state management.

- **Consolidated Source of Truth**: The application uses a single, global `QueryClient` initialized in `QueryProvider` to prevent "Shadow Cache" inconsistencies.
- **Zero-Lag Logout**: The `logout` function in `AuthProvider` explicitly calls `queryClient.clear()` to physically purge all cached data from memory.
- **Tiered Caching Strategy**:
    - **Real-Time (staleTime: 0)**: Core RLS-filtered modules (Participants, Shift Notes, Roster).
    - **Standard (staleTime: 30s - 5m)**: General operational data.
    - **Static (staleTime: 1h+)**: Master lists and configuration.
- **Pending Changes Management**: For complex entities, a "pending changes" pattern (`src/models/*-pending-changes.ts`) is used to track batch updates locally before committing to the DAL.

## 4. Advanced Data Fetching (Roster Module)
The Roster module implements a highly optimized data fetching strategy.

- **Frontend Joining**: To reduce SQL execution time, the system avoids heavy joins for static metadata. The UI maps IDs from cached metadata arrays (Houses, Staff) to shift records.
- **Active Staff Enforcement**: The system strictly enforces the definition of "Active Staff" (status='active' + future house assignment) across all dropdowns and roster logic.

## 5. Activity Logging & Auditing (Gold Standard)
Every operational table includes standard audit columns (`created_at`, `created_by`, etc.) managed at the database level via triggers.

- **Business-Level Auditing**: The `ic_activity_log` table provides a human-readable story of the data's lifecycle, managing Aggregate Root resolution (e.g., linking child changes back to the Participant).

## 6. UI & Styling
- **Metronic v9.4.0** with **Tailwind CSS**.
- **Mobile Standards**: Responsive table layouts (`table-fixed md:table-auto`) and priority column hiding.

## 7. Testing Strategy
- **Unit & Integration (Vitest)**: Verifying business logic, DAL methods, and hook state transitions.
- **Smoke Testing (Vitest)**: Checking major UI pages for successful rendering without crashing (No WSoD).
- **Functional E2E (Playwright)**: CI-only validation of critical business workflows.

## 8. Maintainability Standards
- **Centralized Constants**: Always use `TABLES`, `STORAGE_BUCKETS`, `QUERY_KEYS`, and `ROUTES` config files instead of hard-coded strings.
- **End-to-End Type Safety**: Deriving frontend types directly from the database schema via `Database['public']['Tables']['...']['Row']` and `Awaited<ReturnType<...>>`.
