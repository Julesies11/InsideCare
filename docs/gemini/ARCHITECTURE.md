# InsideCare Application Architecture

This document describes the architectural patterns and state management strategies used in the InsideCare application.

## 1. Backend + Supabase Logic Rules
**All business logic must live inside the React app for maximum testability.**

1.  **Direct Supabase Usage**: Use basic Supabase features only (`select`, `insert`, `update`, `delete`, `auth`).
2.  **No Server-Side Logic**: Do NOT create Supabase SQL functions, triggers, stored procedures, RPC endpoints, or views.
3.  **Client-Side Transforms**: All data transformations, joins, groupings, and aggregations must be done in the app.
4.  **Enum Querying**: Enum columns (like `status`) do NOT support `.ilike()`. Always use `.eq()` or `.in()` for these fields.

## 2. Security & Row Level Security (RLS)
The application enforces strict role-based access control (RBAC) via Supabase RLS.

### Admin Access
- **Global Policy**: A "policy factory" grants users with `is_admin: true` in their JWT metadata full (`FOR ALL`) access to every table in the `public` schema.
- **Storage**: Admins have full access to all storage buckets.

### Staff Access
- **Clinical Awareness**: Staff have `SELECT` access to all Participants and their clinical child entities (medications, routines, notes) to ensure they can provide informed care anywhere.
- **House-Scoped Access**: Access to operational data (Checklists, Calendars, Resources) is strictly scoped to the houses the staff member is assigned to in `house_staff_assignments`.
- **Self-Service**: Staff can manage their own profiles, timesheets, and leave requests (while status is `pending`).

### Non-Recursive Assignment Pattern
To prevent "Infinite Recursion" errors in RLS:
- **Rule**: `house_staff_assignments` is configured with a simple `FOR SELECT USING (true)` policy for authenticated users.
- **Purpose**: This allows the table to act as a stable "lookup" for other tables (like `house_checklists`) to verify assignments without the table querying itself.

## 2. State Management & Data Fetching
- **TanStack Query**: Used for all data fetching and caching.
- **Custom Hooks**: Every entity or feature has a dedicated custom hook (e.g., `useParticipants.ts`, `useStaff.ts`) that wraps TanStack Query.
- **Stable Query Keys**: Ensure consistent and stable query keys across the application.

## 3. Optimized Saving System
The system uses `json-diff-ts` and a custom `useDirtyTracker` hook to optimize database updates.

- **Dirty Tracking**: `useDirtyTracker` compares `formData` with `originalData`.
- **Differential Updates**: Instead of sending the whole object, only changed fields are sent to Supabase.
- **Activity Logging Integration**: Changes are automatically logged with detailed before/after metadata.

### Pending Changes Management
For complex entities with child records (like Participants, Staff, or Houses), a "pending changes" pattern is used.
- **Models**: `src/models/*-pending-changes.ts` define the structure for tracking additions, updates, and deletions of child records.
- **State**: These changes are tracked in local component state and committed to the database during the `onSave` process.
- **Benefits**: Allows users to make multiple changes to child entities and save them all at once, providing a better user experience and reducing database round-trips.

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
