# InsideCare Application Architecture

This document describes the architectural patterns and state management strategies used in the InsideCare application.

## 1. Backend + Supabase Logic Rules
**All business logic must live inside the React app for maximum testability.**

1.  **Supabase Client**: Use `@supabase/ssr` (via `createBrowserClient`) for robust session management and cookie-based persistence.
2.  **Auth Security**: Always use `supabase.auth.getUser()` for authorization checks to ensure the JWT is verified by the Supabase server.
3.  **No Server-Side Logic**: Do NOT create Supabase SQL functions, triggers, stored procedures, RPC endpoints, or views.
4.  **Client-Side Transforms**: All data transformations, joins, groupings, and aggregations must be done in the app.
5.  **Enum Querying**: Enum columns (like `status`) do NOT support `.ilike()`. Always use `.eq()` or `.in()` for these fields.
## 2. Security & Row Level Security (RLS)
The application enforces strict role-based access control (RBAC) via a normalized permissions model and Supabase RLS.

### Granular RBAC (JWT-Based High Performance)
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
- **Data Synchronization & Caching**:
    - **Consolidated Source of Truth**: The application uses a single, global `QueryClient` initialized in `QueryProvider` to prevent "Shadow Cache" inconsistencies.
    - **Zero-Lag Logout**: The `logout` function in `AuthProvider` explicitly calls `queryClient.clear()` to physically purge all cached data from the browser's memory, preventing cross-user data leakage.
    - **Tiered Caching Strategy**:
        - **Real-Time (staleTime: 0)**: Core RLS-filtered modules (Participants, Shift Notes, Roster) always perform a background fetch on visit to ensure immediate enforcement of permission changes.
        - **Standard (staleTime: 30s - 5m)**: General operational data.
        - **Static (staleTime: 1h+)**: Master lists and configuration.
    - **Avatar Signed URL Caching**: The `useSignedUrl` hook leverages TanStack Query to cache Supabase Storage signed URLs. This acts as a deduplication layer, ensuring that if a user's avatar appears multiple times on a single screen (e.g., the Roster Board), the frontend negotiates a signed URL from the backend exactly once, preventing network waterfalls.
    - **Chunked Batching**: The `SignedUrlBatcher` implements an automatic chunking strategy (batches of 50) when requesting signed URLs from Supabase. This prevents `413 Request Entity Too Large` errors when rendering lists with many unique images (e.g., a full participant directory).
- **Access Levels**:
    - `full`: Global access to all records.
    - `context_read_write`: Domain-aware read/write access (locked to `assigned_houses` or `managed_staff_ids`).
    - `context_read_only`: Domain-aware read-only access.
    - `read_only`: Global view access without modification.
    - `none`: Hidden and blocked.
- **Sync Synchronization**: Changes to user roles or assignments automatically trigger the Edge Function to refresh the user's JWT metadata, ensuring security profiles stay up-to-date.

### Dynamic & Database-Driven RBAC
To ensure system flexibility, the RBAC model strictly forbids hard-coding of role identities.

1.  **Role Agnosticism**: Roles must never be identified by name (e.g., `'Admin'`) in application logic or Edge Functions. Roles are managed exclusively via the `roles` table.
2.  **Permission-Based Authorization**: Authorization checks must be performed against specific module permissions in the `role_permissions` table.
3.  **Defining "Admin"**: In the context of system-wide administrative actions (e.g., syncing all user permissions, updating roles), a user is considered an **Admin** if and only if their assigned role has `'full'` access to the `access_control` module.
4.  **Frontend Sync**: Permission-based checks in the frontend should utilize the `RBAC_MODULES` constants found in `src/config/rbac-modules.ts`.

### Staff Access
- **Clinical Awareness**: Staff have `SELECT` access to all Participants and their clinical child entities (medications, routines, notes) to ensure they can provide informed care anywhere.
- **Assigned Events**: Staff can view all calendar events where they are explicitly assigned via the `house_calendar_event_staff` junction table.

### Unified Staff Schedule
The system provides a unified view of staff commitments by merging two data sources:
1.  **Staff Shifts**: Formal working hours assigned to a specific house and roster period.
2.  **Assigned Events**: Specific activities (Community Access, Online Meetings, Training) where the staff member is a participant or facilitator.

This integration is implemented in the `useStaffDashboardData` and `useStaffRoster` hooks, ensuring chronological sorting across both entity types on the Staff Dashboard and My Roster pages.
### House Checklist System: Calendar & Shift Integration
The system supports two distinct operational workflows:
1.  **House Calendar Tasks**:
    - **Purpose**: General facility tasks (e.g., "Mop floor", "Fridge Temps").
    - **Visibility**: Visible to all staff assigned to the House on the Staff Dashboard/Calendar.
    - **Collaboration**: Multiple staff members can contribute to the same checklist. Each item is signed off individually, recording the specific staff member's ID and name (`completed_by`).
    - **Attribution**: The UI displays "Signed by [Name]" for each completed task, providing clear accountability within the house.
2.  **Shift Routines**:
    - **Purpose**: Role-specific responsibilities (e.g., "Morning Protocol", "Night Routine").
    - **Shift Templates**: Admins define work periods (Morning, Day, etc.) with custom icons, colors, and **Default Checklists**.
    - **Roster Auto-Fill**: A specialized "Build Roster" tool on the Roster Board allows admins to rapidly generate coverage based on the House's Shift Templates (defined per house). This process creates the shifts and automatically generates the shift-specific checklist assignments (`shift_assigned_checklists`) based on the defaults linked to those templates.
    - **Shift Locking**: To ensure compliance, "Shift Routines" are locked to the specific assigned shift. Staff can only "Start/Resume" a routine if it matches their currently active `shift_id`.

### Optimized Saving System
The system uses `json-diff-ts` and a custom `useDirtyTracker` hook to optimize database updates.

- **Dirty Tracking**: `useDirtyTracker` compares `formData` with `originalData`.
- **Differential Updates**: Instead of sending the whole object, only changed fields are sent to Supabase.
- **Activity Logging Integration**: Changes are automatically logged with detailed before/after metadata.

#### Checklist Item Submission
For checklists, the saving logic is granular:
- **Status Mapping**: Item completion is tracked via `status` ('Completed' or 'Pending').
- **Attribution**: Every item completion event includes the current user's `staff_id` in the `completed_by` column.
- **Notes & Signs**: Individual task-level notes and staff signatures are persisted to ensure a complete audit trail of facility operations.

### Staff Workspace Separation
The system architecture differentiates between "Administrative Control" and "Frontline Consumption":
- **Admin Workspace**: Uses complex, high-control components like `ShiftDialog` and `EditShiftNoteDialog` for multi-house coordination and backdating.
- **Staff Workspace**: Uses context-locked, read-only components like `ViewShiftDialog` and `StaffShiftNoteDialog`. These components automatically inherit their state from the active roster context, eliminating dropdown errors and streamlining documentation.

### Enhanced Documentation Flow
Clinical notes are integrated into the operational lifecycle:
- **Mid-Shift**: Staff capture observations via the context-aware note dialog.
- **Data Sync**: Mid-shift `shift_notes` are automatically fetched and pre-filled into the `timesheet_form` at the end of the shift.
- **Atomic Operations**: The `useCreateShiftNote` hook implements `upsert` logic to ensure that clinical records are safely merged across multiple save events (mid-shift, draft timesheet, final submission).

### Pending Changes Management
For complex entities with child records (like Participants, Staff, or Houses), a "pending changes" pattern is used.
- **Models**: `src/models/*-pending-changes.ts` define the structure for tracking additions, updates, and deletions of child records.
- **State**: These changes are tracked in local component state and committed to the database during the `onSave` process.
- **Benefits**: Allows users to make multiple changes to child entities and save them all at once, providing a better user experience and reducing database round-trips.

### Master List Management Pattern
For shared lookup data (e.g., Medications, Contact Types, Role Master, etc.), the application uses a "Master List" pattern to ensure data consistency.
- **Master Tables**: Dedicated lookup tables (e.g., `medications_master`, `contact_types_master`) store the source of truth for dropdown options.
- **Management Dialogs**: Dedicated "MasterDialog" components (e.g., `MedicationMasterDialog`) allow authorized users to manage these lists (Add/Edit/Deactivate) directly from the context where they are used.
- **Prop Interface**: Standardized prop interface for these dialogs:
    - `open`: boolean visibility state.
    - `onClose`: function to hide the dialog (must be passed correctly to avoid "unclosable" bugs).
    - `onUpdate`: callback for additional side effects after a change (though TanStack Query handles most refreshing automatically).
- **Cache Invalidation**: Mutations on master tables explicitly invalidate the relevant TanStack Query key (e.g., `['medications-master']`), ensuring all dropdowns and pickers across the app instantly reflect the changes without a page reload.


### Advanced Data Fetching (Roster Module)
The Roster module implements a highly optimized data fetching strategy to handle large volumes of shifts (e.g., 500+ on a single board) with minimal latency.

- **Active Staff Filtering:** The system strictly enforces a definition of "Active Staff" for all house-based operations (Roster Board, House Calendar, Staff Dropdowns). A staff member is only included if they are `active` in the `staff` table AND have an assignment to the house with no `end_date` (or a future `end_date`). This must be applied to:
    - **Linked Staff Counts** on House Profiles.
    - **Staff Dropdowns** on the Roster Board and House Calendar.
    - **Shift Assignment logic** in the Shift Dialog.
- **TanStack Query Caching:** All roster data (shifts, leave, shift templates) is managed via TanStack Query. Queries are keyed by date range and filters, allowing for instantaneous navigation between weeks as data is cached in memory.
- **Frontend Joining:** To reduce SQL execution time and JSON payload size, the system avoids heavy database joins for static metadata.
    - **Pattern**: Instead of joining `houses` and `staff` in every shift query, the application fetches and caches the full lists of active Houses and Staff once.
    - **Mapping**: Shift records are returned with IDs only; the UI layer maps these IDs to the cached metadata arrays in the frontend.
- **Automatic Cache Invalidation**: Mutations (Creating/Updating/Deleting shifts) use the `queryClient` to invalidate relevant query keys, ensuring that all roster widgets (Calendar, Upcoming Shifts, Staff Detail) stay synchronized without manual state management.


## 4. Activity Logging
A centralized activity logging system tracks all major changes in the application.

- **Library**: `src/lib/activity-logger.ts` provides `logActivity` and `detectChanges`.
- **Logic**: It automatically generates human-readable descriptions (e.g., "Updated phone number from 'X' to 'Y'") based on the diff.
- **Metadata**: Stores the full old/new values in a `metadata` JSONB column in the `activity_log` table.

## 5. UI & Styling
- **Metronic v9.4.0**: The application is built on the Metronic React template.
- **Tailwind CSS**: Integrated with Metronic.
- **KeenIcons**: Used for iconography throughout the application.
- **Mobile UI Standards**:
  - Hide non-critical UI on mobile.
  - Table responsiveness: Use `table-fixed md:table-auto`.
  - Priority hiding: Show only the most critical 2-3 columns on mobile.
  - Interactive rows: Make entire table rows clickable on mobile.

## 5. Notification & Deep Linking System
The application features a robust, role-based notification system powered by `supabase_realtime`.

- **NotificationService**: A centralized service (`src/lib/notification-service.ts`) for triggering alerts across the app.
- **Deep Linking Metadata**: Notifications include a `metadata` JSONB column for storing contextual data such as `participantId` and `tab` (section ID).
- **Intelligent Navigation**: The click handlers in `NotificationCenter` and topbar sheets parse metadata to:
    - Append query parameters (e.g., `?tab=medications`).
    - Pass state via React Router.
- **Section Auto-Scrolling**: Complex pages (like Participant Detail) use the `tab` query parameter to automatically scroll the user to the relevant section and provide a visual highlight.

## 6. Frontend Authorization (RBAC)
The UI follows a **"Dumb Frontend, Smart Backend"** philosophy. The frontend only checks if a user has the *theoretical* permission to access a module, while the Supabase Row-Level Security (RLS) handles the actual contextual data filtering (e.g., which houses or participants are visible).

- **`RBAC_MODULES` Constant**: Centralized identifiers for all system modules (found in `src/config/rbac-modules.ts`). Use these instead of hardcoded strings to ensure type safety.
- **`useRBAC` Hook**: Evaluates permissions against a hierarchy (`full > context_read_write > read_only > context_read_only > none`). It performs a simple level check and does not handle database relationship logic.
- **`<AccessControl>` Component**: A declarative wrapper for conditional rendering.
    - **Standard Pattern**: Conditionally shows/hides components based on permission.
    - **Render Prop Pattern**: Passes an `isAllowed` boolean to its children. This is the **preferred pattern for forms**, allowing them to gracefully degrade into a "Read Only" state with disabled buttons and visual labels.
- **Routing Guards**: The `RequirePermission` component ensures a user has at least `context_read_only` access before allowing them into a route section.

### Standardized Form & Detail Page Pattern
To ensure a consistent and secure user experience, all major entity detail pages (Houses, Participants, Staff, Shift Notes) must follow this pattern:

1.  **Permission Computation**:
    - Use `useRBAC` at the top level of the page or content component.
    - Derive `canEdit`, `canAdd`, and `canDelete` flags based on the required `ACCESS_LEVEL` (usually `CONTEXT_READ_WRITE`).
    - Pass these flags down to all nested sub-components.

2.  **Field & Button Locking**:
    - All input fields, selects, and textareas must use `disabled={!canEdit}`.
    - All "Add", "Edit", and "Delete" action buttons must use `disabled={!canEdit}` (or `canAdd`/`canDelete` respectively).
    - If a user has read-only access, the UI should remain visible but interactive elements must be locked.

3.  **Comprehensive Dirty Tracking**:
    - Use the `useDirtyTracker` hook to monitor the "unsaved" state.
    - **Inputs**: Pass both the main `formData` and the entity-specific `pendingChanges` object.
    - **Safety**: Provide fallback empty objects (`formData || {}`, `originalData || {}`) to ensure stable evaluation during initial loading.
    - **Transitivity**: Any change in a sub-page (e.g. adding a staff member to a house) must update the shared `pendingChanges` state, which in turn triggers the `useDirtyTracker` to enable the "Save Changes" button.

**Key Rule:** Never attempt to calculate "Am I assigned to this house?" in the frontend. Let the database filter the query results automatically via RLS.

## 7. Directory Structure
- `src/pages/`: Feature-specific pages and local components.
- `src/hooks/`: Data fetching and business logic hooks.
- `src/components/`: Shared UI components.
- `src/lib/`: Core utilities (Supabase client, activity logger, helpers).
- `src/models/`: TypeScript types and interfaces.
- `migrations/`: Live schema metadata and RBAC definitions.
  - `schema_metadata.json`: Full database structure source of truth.
  - `current_database_rbac.json`: Live RLS policy definitions.
  - `old_consolidated/`: Historical migration files (archived).

## 8. Testing Strategy
The project follows a rigorous testing strategy to ensure reliability of the core business logic.

- **Framework**: [Vitest](https://vitest.dev/) for unit and integration testing.
- **Library**: [React Testing Library](https://testing-library.com/docs/react-reality-library/intro/) for testing hooks and components.
- **API Mocking**: [MSW (Mock Service Worker)](https://mswjs.io/) to mock Supabase REST and Auth endpoints.
  - Handlers are located in `src/test/mocks/handlers.ts`.
  - The mock server is configured in `src/test/mocks/server.ts`.
- **Test Locations**: 
  - Hook tests: `src/hooks/*.test.ts` or `src/hooks/*.test.tsx`.
  - Utility tests: `src/lib/*.test.ts`.
- **Patterns**:
  - **Empirical Reproduction**: When fixing a bug, first create a test case that reproduces the failure.
  - **Hook Isolation**: Tests focus on verifying the state transitions and API calls triggered by custom hooks.
  - **MSW for Stability**: Avoid mocking the Supabase client directly; mock the network layer instead for more realistic integration tests.

## 9. Image Processing & Storage
The application implements a high-performance, client-side image optimization workflow to ensure visual consistency and minimize storage costs.

### Client-Side Optimization
- **Library**: `browser-image-compression`.
- **Worker-Based Processing**: Image resizing and compression are performed in Web Workers to prevent UI thread blocking.
- **Privacy & Metadata**: All EXIF data (GPS, camera info) is stripped before upload to protect privacy and reduce file size.
- **Standardized Presets**:
    - **`AVATAR`**: 256px max, ~50KB target, converted to JPEG.
    - **`EVIDENCE`**: 1600px max, ~800KB target, converted to JPEG.

### Centralized Storage API
The `src/lib/api/storage.ts` module acts as the orchestrator for all storage operations.
- **Validation**: Enforces a 10MB pre-compression hard limit and valid MIME types (JPG, PNG, WebP).
- **Atomic Operations**: `uploadFile` handles validation -> compression -> upload in a single async operation.
- **Path-Based Storage**: The system stores relative file paths in the database (e.g., `staffId/avatar.jpg`) instead of full URLs, ensuring compatibility across local/staging/production environments.
## 8. Centralized Maintainability (Constants)
To ensure long-term maintainability and enforce project standards (like the `ic_` prefixing requirement), the application uses centralized constants located in `src/config/`:

- **`TABLES`** (`src/config/db-tables.ts`): All database table names. MUST be used for all Supabase queries to ensure consistent prefixing.
- **`STORAGE_BUCKETS`** (`src/config/storage-buckets.ts`): All Supabase storage bucket names.
- **`QUERY_KEYS`** (`src/config/query-keys.ts`): Standardized TanStack Query keys to ensure cache invalidation works reliably across the app.
- **`STATUS` / `CHECKLIST_STATUS`** (`src/config/enums.ts`): Centralized enum values for database-driven statuses.

**Rule**: Never use hard-coded strings for database objects or query keys. Always import from the corresponding config file.

## 10. End-to-End Type Safety
The application implements a strict end-to-end type safety model where the database schema is the single source of truth for the entire frontend.

### 1. Database-Derived Types
Manual TypeScript interfaces for database records are forbidden. All core data models (e.g., `Staff`, `House`, `Participant`) are derived directly from the auto-generated Supabase schema types.
- **Workflow**: Whenever the database schema changes, the types must be regenerated using `supabase gen types typescript`.
- **Derived Rows**: Use `Database['public']['Tables']['ic_table_name']['Row']` to ensure frontend properties exactly match the API response.

### 2. Strictly Typed Client
The Supabase client is initialized with the `Database` generic: `createBrowserClient<Database>(...)`. This enables:
- **Query Validation**: The `.from()`, `.select()`, `.eq()`, and `.update()` methods are strictly typed, flagging typos in table or column names at build time.
- **Return Type Inference**: TypeScript automatically knows the shape of the data returned by any query, eliminating the need for manual type casting (e.g. `as Staff[]`).

### 3. Automatic Relational Inference
For queries involving joins, the application uses TypeScript's `Awaited<ReturnType<...>>` patterns to automatically infer nested object shapes from the query itself.
- **Pattern**: Extract the return type of the query builder to ensure frontend types exactly match the data fetching logic.
- **Benefits**: This prevents "Shadow Types" where manual interfaces for joined data get out of sync with actual SQL queries.

## 11. Testing & Reliability Patterns

### 1. Component Environment Safety
Components that utilize browser globals (like `document`, `window`, or `localStorage`) within asynchronous logic (e.g., `setTimeout`, `setInterval`, or event listeners) must include safety checks to prevent test-time regressions.
- **Pattern**: `if (typeof document === 'undefined') return;`
- **Tear Down**: Always clear timeouts and remove event listeners in the `useEffect` cleanup function to prevent memory leaks and "unhandled error" failures in Vitest.

### 2. Robust Smoke Testing (No WSoD)
The application uses a "Negative Proof" strategy for smoke testing to maximize reliability across dynamic layouts.
- **Strategy**: Instead of asserting on specific text or headers (which change frequently), the tests verify the **absence of failure**.
- **`checkNoWSoD` Helper**:
    1. Verifies the `#root` element is visible and populated.
    2. Verifies that no Error Boundary text ("Something went wrong") is visible.
    3. Verifies that no Vite crash overlay is attached to the DOM.

### 3. CI Authentication Persistence
To prevent repeated logins during CI, the system uses Playwright `storageState`. 
- **Setup**: `tests/auth.setup.ts` performs a single login per role (Admin/Staff) and persists the resulting cookies and local storage to `.json` files.
- **Reliability**: Form submission in CI uses `page.keyboard.press('Enter')` to bypass issues with hidden or overlapping buttons.

