# Requirements: House Checklist & Dynamic Shift System

## 1. Overview
The House Checklist system is designed to manage recurring facility tasks and individual staff responsibilities. It prioritizes flexibility, allowing each House to maintain its own unique routines while providing tools to share "best practice" templates between locations.

## 2. Core Checklist Model
The system distinguishes between two primary operational workflows:

### 2.1. House Calendar Tasks
*   **Purpose**: Facility-wide tasks that aren't tied to a specific person (e.g., "Fridge Temps", "Cleaning", "Maintenance").
*   **Visibility**: Visible to all staff assigned to the House on that day.
*   **Collaboration**: Multiple staff members can contribute to the same checklist. 
*   **Attribution**: Each item is "Signed" by the staff member who completed it. The system must record the `staff_id` and name of the person who checked each specific item.
*   **UI Requirement**: Display "Signed by [Staff Name]" next to completed items.

### 2.2. Shift Routines
*   **Purpose**: Standardized routines performed at the start or end of a specific work period (e.g., "Start of Shift", "End of Shift").
*   **Assignment**: Explicitly linked to a rostered shift.
*   **Responsibility**: The specific staff member assigned to that shift is responsible for completing and signing off the checklist.
*   **Content**: Includes standard handover tasks (medication checks, communication logs, SIL notes).

## 3. The "Fork & Customize" Import Tool
Instead of a rigid Global Master system, the app uses a "Pull-based" import model.

*   **Location**: Integrated into the **House Detail -> Checklists** tab.
*   **Functionality**:
    *   Allows the Admin to select a "Source House."
    *   Lists all checklists available at the source house with granular checkboxes.
    *   **Deep Clone**: When imported, the system creates a fresh copy of the checklist and all its items for the current house.
    *   **Independence**: Once imported, the new checklist is a "fork" and can be modified without affecting the original source.
*   **Use Case**: Setting up a new house by copying a proven "Monday Tasks" checklist from an existing house and then tweaking it for local needs.

## 4. Dynamic Shift Templates
The system must move away from hardcoded "Morning, Day, Night" constraints to a flexible, House-specific shift templates.

*   **House Shift Types**: Each House manages its own list of shift names (e.g., "Morning", "Afternoon", "Sleepover", "Active Night").
*   **Management UI**: Admin can add, rename, or reorder shift types on the House Settings page.
*   **Schema Change**: Replace the `group_title` check constraint with a dynamic lookup to the House's specific shift types.
*   **Import Intelligence**: When importing a checklist, the tool should detect if a required shift type (e.g., "Afternoon") is missing in the target house and offer to create it automatically.

## 5. Simplified Scheduling UI & Logic
The scheduling interface and underlying logic are drastically simplified, removing arbitrary categories (Daily, Quarterly) in favor of a strict two-path assignment model.

### 5.1. Checklist Creation (Template Phase)
*   **Pure Templates**: When a checklist is created, it has **no inherent frequency**. It is simply a named collection of tasks (a template).
*   **Removal of Categories**: The UI no longer asks for "Daily", "Weekly", "Monthly" during the creation phase.

### 5.2. The Assignment Dichotomy (Scheduling Phase)
When an Admin schedules a checklist, they are forced to choose between two distinct assignment paths:

#### Path A: House Calendar Tasks
*   **Purpose**: Facility tasks visible to anyone working on that day (e.g., "Monday Tasks", "Monthly Audit").
*   **Streamlined Frequency**: Only two options are presented:
    1.  **Weekly (Select Days)**: UI displays `[M] [T] [W] [T] [F] [S] [S]` toggles. (e.g., Select 'Monday' for Monday tasks; select all 7 for daily tasks).
    2.  **Monthly (Same Date)**: UI displays a dropdown for dates `1-31` or `Last day of month`.
*   **Execution Logic**: Generates an `rrule` in `checklist_schedules`. The system creates a blank checklist for the House on the specified dates.

#### Path B: Shift Routines
*   **Purpose**: Standardized routines performed every time a specific shift occurs (e.g., "Start of Shift", "End of Shift").
*   **Shift Targeting**: The UI lists the House's dynamic shift types (e.g., `[x] Morning`, `[x] Day`, `[x] Night`).
*   **Rule of Simplicity**: Shift-linked checklists apply to *every occurrence* of that shift. (Tasks that only happen on specific days, like Wednesday "Bin Night", should be placed in the *House Calendar* Wednesday checklist under the 'Night' group, not as a shift-linked exception).
*   **Execution Logic**: Writes to `shift_assigned_checklists`. The system attaches the checklist directly to the specific `staff_shifts` record when the roster is generated.

## 6. Technical Specifications
*   **Logic in TypeScript**: All calculations for due dates, shift linking, and completion status must reside in React hooks/API utilities.
*   **Attribution Storage**: `house_checklist_submission_items` must store `completed_by` (staff_id), `status` (Completed/Pending), and `notes`.
*   **Granular Persistence**: Support "Save Progress" (Draft) and "Complete" (Final) states.
*   **Offline Resilience**: Implement local storage drafting to prevent data loss during connectivity issues (already partially implemented).

## 7. Migration Requirements
*   **Shift Type Table**: Create `house_shift_templates` table linked to `houses`.
*   **Refactor Constraints**: Update `checklist_item_master` and `house_checklist_items` to link to `house_shift_templates` instead of using a hardcoded string check.

## 8. Roster & Open Shifts Strategy
To enable efficient, large-scale scheduling across multiple houses, the Roster Board operates on a "Template -> Open Shift -> Assignment" workflow, decoupling shift creation from staff assignment.

### 8.1. Shift Templates
The dynamic `house_shift_templates` table acts as the foundation for shift templates.
*   **Enhancement**: `house_shift_templates` will be updated to include `default_start_time` and `default_end_time`.
*   **Benefit**: When an admin adds a "Morning Shift" to the roster, the system automatically populates the required timeframe, reducing manual data entry.

### 8.2. Open Shifts (Unassigned Shifts)
The fundamental change to rostering is the ability to create shifts without immediately assigning a staff member.
*   **Schema Update**: The `staff_id` column in the `staff_shifts` table will be altered to `DROP NOT NULL`.
*   **Workflow**: House Managers can build a "Skeleton Roster" (a full week of required coverage) first.
*   **Visibility**: The Roster Board UI will visually highlight these "Open Shifts" (e.g., in red or yellow) to clearly indicate where coverage is lacking.

### 8.3. Intelligent Assignment UI
Once open shifts exist, the admin assigns staff using an intelligent matching system.
*   **The Action**: Clicking "Assign" on an open shift reveals a list of staff members.
*   **Casual Staff Model**: Most staff are casual and do not have set contracted hours. They are assigned to shifts by the Admin user based on the house needs.
*   **Smart Suggestions**: The UI will filter and prioritize staff based on:
    *   **Availability**: Staff not already rostered for a conflicting time.
    *   **Qualifications**: Staff holding the required compliance checks for the House/Participant.

### 8.4. "Copy Week" Feature
To eliminate redundant administrative work, the system will support rolling out schedules rapidly.
*   **Functionality**: A "Copy Previous Week" action on the Roster Board.
*   **Options**:
    *   *Copy Skeleton Only*: Duplicates the structure of open shifts for a new week.
    *   *Copy with Assignments*: Duplicates both the shifts and the assigned staff members (ideal for stable, recurring rosters).
*   **Result**: Roster creation time is reduced to seconds, requiring only minor manual tweaks for leave requests or exceptions.

## 9. Automated Shift-Checklist Tie-in
The connection between the roster and checklists is handled through a dynamic "Lookup Loop" that ensures operational requirements are met regardless of which staff member is assigned.

### 9.1. The Data Path
`House Shift Type` (e.g., Morning) -> `Staff Shift` (The Roster Row) -> `Shift Assigned Checklist` (The Mapping Rule) -> `Checklist Submission` (The actual execution data).

### 9.2. Operational Behavior
*   **Planning Phase**: Admins create shifts linked to a `shift_template_id`. Checklists are implicitly attached via the mapping table.
*   **Assignment Phase**: When a staff member is assigned to an "Open Shift", they inherit the responsibility for all linked checklists.
*   **Execution Phase**: The Staff Dashboard queries for active shifts and displays the corresponding "Start" and "End" checklists automatically.
*   **Accountability**: Checklist submissions are linked directly to the `shift_id` in the roster, providing a definitive audit trail of who was responsible for which tasks during a specific timeframe.

## 10. Implementation Workflow: The "Roster Wizard"
To provide a polished Metronic v9 experience, the process of setting up a House's operational skeleton will use a multi-step **Stepper/Wizard** interface.

### 10.1. UI Components
*   **Metronic Stepper**: Utilizes the `Stepper` component for a guided, non-overwhelming setup process.
*   **Visual Feedback**: Progress indicators showing completion of House settings, Shift templates, and Checklist assignments.

### 10.2. Wizard Steps
1.  **Step 1: Shift Template Definition**: Configure the dynamic shift types (Morning, Afternoon, Night, etc.) with default start/end times.
2.  **Step 2: Calendar Task Setup**: Select or import the core "Daily Tasks" (Monday-Sunday) for the House Calendar.
3.  **Step 3: Shift Routine Assignment**: Link standardized templates (Start/End of Shift) to the shift types defined in Step 1.
4.  **Step 4: Roster Skeleton Generation**: Build the weekly coverage requirements (The "Skeleton") using the shift templates.
5.  **Step 5: Review & Publish**: A final summary view to validate the operational flow before taking the House "Live".

### 10.3. User Experience
*   **Modal vs. Page**: The wizard will be implemented as a dedicated setup page for new houses, or a full-screen modal for existing house updates.
*   **"Save & Exit"**: Support for partial completion, allowing admins to pause and resume the setup process.

## 11. Bulk Roster Management
To support long-term operational planning and rapid corrections, the system provides integrated bulk management tools directly on the Roster Board.

### 11.1. Bulk Shift Manager
Integrated directly into the Roster Board (permanently grouped by House), this tool allows for large-scale modifications.
*   **Accessibility**: A "BULK" button is located under each House name in the grouped view for context-aware management.
*   **Reliability**: Added smoke tests for critical sub-components like `HouseComms` to prevent runtime crashes.
*   **Capabilities**:
    *   **Bulk Delete**: Remove all shifts matching specific criteria (Date Range, House, Staff, Shift Type, Status).
    *   **Bulk Update Status**: Batch update the status of shifts (e.g., transition all 'Scheduled' shifts to 'Published' for a whole month).
*   **Safety**: Includes confirmation prompts and clear visual warnings for destructive actions.

### 11.2. Quick Populate Roster
A one-click tool to rapidly generate coverage based on the House's Shift Templates.
*   **Action**: "POPULATE" button located next to the BULK button under House names.
*   **Logic**: Uses the `materializePattern` engine to fill a selected date range with the house's standard shift structure, automatically skipping duplicates.

## 12. Checklist UI Optimizations
The House Detail interface has been streamlined to prioritize operational relationships.

### 12.1. Integrated History
*   **Consolidation**: The "Checklist History" section has been moved inside the "Checklist Setup" section. This keeps the configuration and the audit trail of execution in a single logical location.
*   **Context**: Allows managers to see how a checklist is being performed while simultaneously managing its tasks or schedule.

### 12.2. Space-Saving Previews
*   **Compact Cards**: Checklist template cards now only show the first **2 items** as a preview to save vertical space.
*   **Simplified Metadata**: The "Required" label has been removed from the preview view to reduce visual noise, as requirement status is intrinsic to the checklist's operational role.

## 12. Flexible Shift Templates
The Shift Template system has been refactored from a rigid 7-day week to a flexible, titled group model.

### 12.1. Hierarchical Structure
*   **Shift Template Group**: A named container (e.g., "Weekday", "Weekend", "Christmas Day").
*   **Shift Template Items**: Individual shifts defined within a group, inheriting from `house_shift_templates` but allowing for custom start/end times and checklist overrides.

### 12.2. Default Checklists & Dynamic Styling
*   **Shift Template Definitions (Types)**: Admins can define work periods with specific:
    *   **Colors**: Standard themes (Morning, Day, Afternoon, Night, Community).
    *   **Icons**: A visual repository of 50+ Lucide icons (Time, Care, Domestic, Logistics).
    *   **Defaults**: Default checklists that are automatically inherited by shifts in a template.
*   **Roster Board Integration**: Roster cards now dynamically render based on the Shift Template ID, ensuring visual consistency between configuration and the live roster.

### 12.3. Saving Architecture (Seamless Save)
*   **Pending Changes Pattern**: Shift Templates are tracked locally in `pendingChanges` and saved only when the main "Save" button is clicked.
*   **Optimistic Cache Seeding**: To prevent UI flicker, the system manually "seeds" the TanStack Query cache immediately after a successful save before clearing local state.
## 13. Completion Enforcement & Accountability
To ensure operational compliance, the system enforces the completion of mandatory routines through a combination of visual cues and submission blocking.

### 13.1. Timesheet Blocking
*   **Logic**: The "Submit Timesheet" form automatically checks for any `shift_assigned_checklists` linked to the specific shift instance.
*   **Enforcement**: If any shift-assigned checklists are not in a `completed` status, the "Submit Timesheet" button is disabled (grayscale), and a "Required Shift Routines" card displays the pending tasks with a link to complete them.
*   **Exception**: Collaborative "House Calendar Tasks" do not block individual timesheets, as they are shared responsibilities.

### 13.2. Dashboard Visual Cues
*   **Active Shift Tracking**: The Staff Dashboard displays a real-time progress bar for mandatory routines during an active shift.
*   **End-of-Shift Warnings**: When a shift is within 30 minutes of its scheduled end time, any incomplete mandatory routines are highlighted with an orange pulsed border and an "Urgent" status badge on the Checklists page.

### 13.3. Admin Audit Trail
*   **Real-time Visibility**: Admins can view the "Checklist History" on the House Detail page to see progress in real-time.
*   **Granular Attribution**: Every item within a checklist (both shared house tasks and individual routines) records the specific staff member who performed the sign-off, fulfilling the requirement for individual accountability in a collaborative environment.
