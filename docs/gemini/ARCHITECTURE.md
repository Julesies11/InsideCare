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

### Granular RBAC (Normalized Model)
As of **May 14, 2026**, the system uses a fully normalized, column-based RBAC model with **Polymorphic RLS Hardening**:
- **`role_permissions` Table**: Stores module-specific access levels for each Role.
- **Access Levels**:
    - `full`: Global access to all records.
    - `context_locked`: Domain-aware access. Enforced via polymorphic RLS:
        - **House Context**: Clinical data (Participants, Medications, Notes) is locked to the user's assigned houses via `house_staff_assignments`.
        - **Managerial Context**: HR data (Timesheets, Leave) is locked to the user's direct reports via `manager_id`.
    - `read_only`: Global view access without modification.
    - `none`: Hidden and blocked.
- **Performance Optimization**: The user's `staff_id` is embedded directly into the JWT metadata during synchronization. This allows RLS policies to perform security checks instantly without joining the `staff` table on every row.
- **Global Flag Support**: Operational entities like `house_checklists` support an `is_global` flag which overrides house-based locking for facility-wide visibility.
- **JWT Sync**: Permissions and identity metadata are automatically synced to the Supabase Auth user metadata. Triggers ensure that changes propagate instantly to all affected users.

### Admin Access
...

- **Global Policy**: A "policy factory" grants users with `is_admin: true` in their JWT metadata full (`FOR ALL`) access to every table in the `public` schema.
- **Storage**: Admins have full access to all storage buckets.

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

## 6. Directory Structure
- `src/pages/`: Feature-specific pages and local components.
- `src/hooks/`: Data fetching and business logic hooks.
- `src/components/`: Shared UI components.
- `src/lib/`: Core utilities (Supabase client, activity logger, helpers).
- `src/models/`: TypeScript types and interfaces.
- `migrations/`: SQL migration files for the database schema.
  - `2026032000_baseline_schema.sql`: The consolidated schema baseline (March 20, 2026).
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
