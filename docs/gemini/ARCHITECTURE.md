# InsideCare Application Architecture

This document describes the architectural patterns and state management strategies used in the InsideCare application.

## 1. Backend + Supabase Logic Rules

**All complex business logic should be implemented in testable environments.**

1.  **Supabase Client**: Use `@supabase/ssr` (via `createBrowserClient`) with **Cookie-based persistence**. This is the "Gold Standard" for InsideCare, providing maximum security (XSS protection) and a unified session store across all browser tabs.
2.  **Auth Security**: Always use `supabase.auth.getUser()` for authorization checks to ensure the JWT is verified by the Supabase server.
3.  **Edge Functions (Preferred for Backend Logic)**: Supabase Edge Functions are permitted and encouraged for complex business logic, transactional operations, and security-sensitive tasks. They must be unit-tested using Deno's native testing framework or compatible Vitest configurations.
4.  **No SQL-Based Logic**: Do NOT create Supabase SQL functions, triggers, stored procedures, RPC endpoints, or views for business logic. These are restricted because they cannot be easily unit-tested or version-controlled as part of the application's testing suite.
5.  **Client-Side Transforms**: While Edge Functions are preferred for heavy lifting, lightweight data transformations, joins, and aggregations can still be performed within the React app for immediate UI responsiveness.
6.  **Enum Querying**: Enum columns (like `status`) do NOT support `.ilike()`. Always use `.eq()` or `.in()` for these fields.

## 2. Authentication & Session Strategy ("Gold Standard")

The application implements a robust authentication lifecycle designed for high-performance multi-tab stability.

### 2.1 Implementation Details

- **Persistence**: Auth tokens are stored in `httpOnly` cookies, shared across all tabs on the same origin.
- **Security Flow**: Strictly uses the **PKCE (Proof Key for Code Exchange)** flow.
- **Provider**: The `AuthProvider` (in `src/auth/providers/supabase-provider.tsx`) serves as the single source of truth for auth state.

### 2.2 Multi-Tab Stability (Race Condition Protection)

To prevent the "Refresh Token Reuse" security lockout common in multi-tab SPAs:

1.  **Quiet Initialization**: The `AuthProvider` implements a 200ms "quiet period" on mount. It waits for the automatic `onAuthStateChange` event before attempting a manual session fallback, preventing "Double Call" collisions.
2.  **Singleton Profile Fetching**: Profile network requests are managed via a singleton promise, ensuring only one profile fetch is active across any state change event.
3.  **Observer Pattern**: The system relies on the Supabase listener to sync state across tabs. When one tab refreshes or logs out, all other tabs pick up the event via the shared cookie store.
4.  **Reuse Interval**: This architecture requires a **10-30 second "Refresh Token Reuse Interval"** in the Supabase Dashboard (Auth Settings) to handle browser-throttled background tabs.

### 2.3 White-Labeled Resend Email & Token Exchange

As of **July 2026**, the application uses a custom Edge Function + Resend API strategy to deliver white-labeled authentication emails:

- **Token Generation**: Edge Functions (`ic-invite-staff-user`, `ic-send-password-reset`) use `supabaseAdmin.auth.admin.generateLink()` to generate one-time `hashed_token` values without sending Supabase default emails.
- **Client Route Exchange**: Action links point directly to `${origin}/auth/confirm?token_hash=${hashed_token}&type=${type}`. The `<ConfirmPage />` component verifies the token via `supabase.auth.verifyOtp()` and redirects to `/auth/change-password`.
- **Domain Security & Open-Redirect Protection**: Edge Functions enforce `getTrustedOrigin()` checks on redirect targets to prevent link hijacking.

## 3. Security & Row Level Security (RLS)

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
- **"No Legacy" Refactor (June 2026)**: Following the modernization mandate, complex entities have been refactored to be strictly **ID-Driven**. Redundant string fields (e.g., `compliance_name`) have been removed from pending state models and DAL mutation payloads. The system now relies exclusively on relational joins for display names, ensuring data integrity and eliminating synchronization debt.
- **Surgical Synchronization (Transactional Safety)**: For nested sub-entities (like Checklist Items), the DAL implements a "Surgical Sync" pattern using `upsert` and targeted `delete`. This ensures clinical history and foreign key links (e.g. from submissions) are preserved while still allowing full CRUD flexibility on the parent entity.

## 4. Advanced Data Fetching & Performance Optimization (Roster Module)

The Roster module implements a highly optimized data fetching and rendering strategy.

- **Frontend Joining**: To reduce SQL execution time, the system avoids heavy joins for static metadata. The UI maps IDs from cached metadata arrays (Houses, Staff) to shift records.
- **Active Staff Enforcement**: The system strictly enforces the definition of "Active Staff" (status='active' + future house assignment) across all dropdowns and roster logic.
- **`houseStaffMap` O(1) Lookup Cache**: The Roster Board components construct a memoized `houseStaffMap` mapping each `houseId` to a set of active assigned `staffId`s. During grid/calendar rendering, check operations are performed in O(1) time using `houseStaffMap[houseId]?.has(staffId)`, preventing expensive nested array scans and eliminating layout thrashing during drag-and-drop actions.
- **Deferred Query Loading (`enabled` Pattern)**: Form and dialog components (e.g., `ShiftDialog`, `BulkActionModal`, `HouseChecklistSetup`) defer loading heavy master lists (such as all active participants, houses, or staff) by binding the React Query `enabled` option to the visibility/open state of the dialog or dropdown. This avoids redundant query executions on initial page load.
- **`useHouseStaffAssignments` Fetch Safety**: The query hook is guarded by default (`enabled: options?.enabled !== undefined ? options.enabled : !!houseId`) to prevent network calls when `houseId` is undefined, while still allowing callers to manually control the query lifecycle.

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

## 9. Master List Deactivation Standard

As of **June 2, 2026**, the application implements a strict "Deactivate instead of Delete" standard for all master list items (e.g., Medication Types) to maintain foreign key integrity and clinical history.

- **Contextual Filtering**: UI forms must implement contextual filtering logic (e.g., `getDisplayMedicationTypes`).
- **Behavior**: Dropdowns show only active items for new records, but include the current inactive item when editing an existing record to prevent data loss or "missing" selections.
- **API Support**: API methods must support `includeInactive` filters to accommodate this standard.

## 10. Clinical Tracker Standards

Clinical trackers (Sleep, Bowel, Seizure, etc.) follow a strict "Preference-Driven Visibility, Data-Driven Occurrence" pattern:

- **Visibility**: Sections and sidebar links are visible ONLY if the participant's profile has the corresponding `track_*` flag enabled.
- **Occurrence Flags**: Flags like `bowel_movement_occurred` or `seizure_occurred` are derived in the UI layer during the save process. They are set to `true` if ANY data (notes, IDs, times) has been entered in that section, and `false` otherwise. This prevents "false positive" documentation where a tracker is marked as having occurred just because it is being tracked.
- **Master List Alignment**: All tracker fields use the `_id` suffix (e.g., `sleep_quality_id`) to maintain strict foreign key integrity with the master list tables.

## 6. UI & Data Presentation Standards

### 6.1 Detail Navigation ("InsideCare Pattern")

To ensure a clean interface and support power-user workflows (e.g., right-click open in new tab), all primary entity navigation must follow these rules:

- **Affordance**: Primary entities (Names, Dates) must be clickable links using the `Link` component.
- **Color**: Use Steel Blue (`text-blue-700` / `dark:text-blue-400`).
- **Weight**: Use `font-medium` (Non-bold).
- **Avatars**: Always include `<SecureAvatar>` (for Staff/Participants) or a `<HouseIcon>` (for Houses) alongside the name in link contexts to provide visual recognition.
- **Grouping**: Wrap the Avatar/Icon and Name together in a single `group` Link for a generous hit area and shared hover state (`group-hover:underline`).
- **Centralization**: Redundant "Actions" columns for simple navigation (View/Edit) are **strictly forbidden**. Navigation must be centralized through the primary entity link.
- **Documents**: To optimize user workflow, documents are accessed via a **Single-Click** to view inline in a new tab. This avoids unnecessary downloads for quick reference. Explicit downloads are still available via the right-click context menu or dedicated action buttons.
- **Scope**: This pattern is applied globally across all data grids, list views, and dashboards (excluding forms, inputs, and print-ready views).

### 6.2 Data Grid & Table Standards

All main list views must adhere to high data density and accessibility standards, utilizing a **Hybrid Responsive Strategy**:

- **Desktop/Tablet Layout**: Use `width: 'fixed'` to ensure the table fits the container perfectly without horizontal scrollbars.
- **Mobile Layout (Choice B)**: On narrow screens, allow horizontal scrolling to preserve data access, but **Pin the primary column (Name)** to the left side (`columnsPinnable: true`) so context is never lost while scrolling.
- **Text Wrapping**: Every column must support text wrapping using `break-words` and `whitespace-normal`. Never use `truncate` for primary data columns.
- **Alignment**: Cells must use `items-center` for vertical centering and `text-left` for standard horizontal alignment.
- **Contact Info**: Combine Email and Phone into a single "Contact" column. Use the `select-all` utility class on text to facilitate easy one-click copying.
- **Pagination**: Default to **25 rows per page**.
- **State Management**: All search queries and filters (Status, Role, House, etc.) must be synced with **URL search parameters** to preserve view state during navigation or refresh.
- **Sorting**: Enable server-side sorting for all primary data columns.

### 6.3 Master List Comboboxes

To ensure users can always find the correct entry in a master list dropdown (e.g., Medications), the application follows these rules:

- **Large Fetch Size**: Components using `useMedicationsMaster` for dropdown selection must request a large `pageSize` (e.g., 1000) to ensure the full active list is available locally for the combobox.
- **Selection Persistence**: Combobox filters must explicitly include the _currently selected_ item, even if that item has been deactivated in the master list, to ensure historical records can be viewed and edited without losing data.
