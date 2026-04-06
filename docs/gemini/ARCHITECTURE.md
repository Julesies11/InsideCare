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
The application enforces strict role-based access control (RBAC) via Supabase RLS.

### Admin Access
- **Global Policy**: A "policy factory" grants users with `is_admin: true` in their JWT metadata full (`FOR ALL`) access to every table in the `public` schema.
- **Storage**: Admins have full access to all storage buckets.

### Staff Access
- **Clinical Awareness**: Staff have `SELECT` access to all Participants and their clinical child entities (medications, routines, notes) to ensure they can provide informed care anywhere.
### House Checklist System: Calendar & Shift Integration
The system supports two distinct operational workflows:
1.  **House Calendar Tasks**:
    - **Purpose**: General facility tasks (e.g., "Mop floor", "Fridge Temps").
    - **Visibility**: Visible to all staff assigned to the House on the Staff Dashboard/Calendar.
    - **Collaboration**: Multiple staff members can contribute to the same checklist. Each item is signed off individually, recording the specific staff member's ID and name (`completed_by`).
    - **Attribution**: The UI displays "Signed by [Name]" for each completed task, providing clear accountability within the house.
2.  **Shift Routines**:
    - **Purpose**: Role-specific responsibilities (e.g., "Morning Protocol", "Night Routine").
    - **Shift Model**: Admins define work periods (Morning, Day, etc.) with custom icons, colors, and **Default Checklists**.
    - **Roster Auto-Fill**: A specialized "Populate Roster" tool on the Roster Board allows admins to rapidly generate coverage based on the House's Shift Types (defined per house). This process creates the shifts and automatically generates the shift-specific checklist assignments (`shift_assigned_checklists`) based on the defaults linked to those shift types.
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

### Pending Changes Management
For complex entities with child records (like Participants, Staff, or Houses), a "pending changes" pattern is used.
- **Models**: `src/models/*-pending-changes.ts` define the structure for tracking additions, updates, and deletions of child records.
- **State**: These changes are tracked in local component state and committed to the database during the `onSave` process.
- **Benefits**: Allows users to make multiple changes to child entities and save them all at once, providing a better user experience and reducing database round-trips.

### Advanced Data Fetching (Roster Module)
The Roster module implements a highly optimized data fetching strategy to handle large volumes of shifts (e.g., 500+ on a single board) with minimal latency.

- **Active Staff Filtering:** The system strictly enforces a definition of "Active Staff" for all house-based operations (Roster Board, House Calendar, Staff Dropdowns). A staff member is only included if they are `active` in the `staff` table AND have an assignment to the house with no `end_date` (or a future `end_date`). This must be applied to:
    - **Linked Staff Counts** on House Profiles.
    - **Staff Dropdowns** on the Roster Board and House Calendar.
    - **Shift Assignment logic** in the Shift Dialog.
- **TanStack Query Caching:** All roster data (shifts, leave, shift types) is managed via TanStack Query. Queries are keyed by date range and filters, allowing for instantaneous navigation between weeks as data is cached in memory.
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
- **Library**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for testing hooks and components.
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
