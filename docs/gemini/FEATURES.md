# InsideCare Features & Modules

This document provides a brief overview of the major modules and features in the InsideCare application.

## 1. Participant Management

Central hub for all information related to care recipients.

- **Profiles**: Comprehensive views of personal information, medical history, and goals.
- **Medication Register**: Centralized master list of all medications used in care. Supports server-side pagination (50 per page), remote sorting, and category filtering. Provides an administrative interface for clinical guidance (side effects, interactions).
- **Child Entities**: Detailed management of medications, documents, goals, notes, contacts, hygiene routines, and restrictive practices.
- **Clinical Trackers Setup**: Dedicated setup section to configure active clinical trackers (Bowel, Seizure, Sleep, Behaviour, Community, Nutrition, Mealtime Management, Hygiene) on a participant's care plan, dynamically controlling which trackers are shown during shift note documentation.
- **Optimized Saving**: Uses `json-diff-ts` to only update changed fields.

## 2. Staff Management

Management of care providers and support staff.

- **Profiles**: Personal and professional information, qualifications, and certifications.
- **Portal Access Lifecycle**: Unambiguous, plain-English model for managing staff logins to the staff portal:
  - **Login Disabled** (secondary badge): Staff member has no `auth_user_id` or web access is turned off. An admin can send an initial invite via the "Send Portal Invite" action.
  - **Invite Pending** (warning/amber badge): An `auth_user_id` exists but the staff member has not yet confirmed their email (`confirmed_at` and `last_sign_in_at` are both null). The admin can "Resend Invite" to send a fresh invitation email.
  - **Login Enabled** (success/green badge): The staff member has confirmed their account (`confirmed_at` or `last_sign_in_at` is set). The admin can send a "Send Password Reset" link for the confirmed account.
  - **Staff Table Dual Status Filters**: Staff table features two separate filter controls:
    - **Status (Employment)**: Filter by `Active`, `Draft`, `Inactive` (defaults to `['active', 'draft']`).
    - **Portal Access**: Filter by `Login Enabled`, `Invite Pending`, `Invite Expired`, `Login Disabled` (defaults to `[]` / All).
  - **Status & Access Cell Rendering**: The table column header is titled **"Status & Access"**. Line 1 renders the primary employment badge (`Active`, `Draft`, `Inactive`). Line 2 renders the secondary portal badge (`Invite Pending`, `Invite Expired`, `Login Disabled`) when action/attention is needed, while hiding the secondary badge for standard `Login Enabled` active staff to prevent visual clutter.
  - **Draft Profile Helper Notice**: Viewing a `Draft` profile card displays an explicit helper notice: *"Draft profile — activate employee to send portal invite"*, clearly communicating why invitation actions are disabled.
  - **Compact Portal Access Bar**: A high-density, single-row bar on the staff profile housing all login credentials, timestamps, email, and action buttons (*Send Invite*, *Resend Invite*, *Copy Link*, *Disable Web Login*) as a single source of truth.
  - **White-Labeled Invitation & Password Setup**:
    - **Scanner-Proof Email Verification**: User invitation emails route to `/auth/confirm?token_hash=...&type=invite`. The `ConfirmPage` enforces a manual "Confirm & Continue" click before calling `supabase.auth.verifyOtp`, completely shielding single-use tokens from automated security scanners (Mimecast, SafeLinks).
    - **Unified Password Setup**: Upon confirmation, users transition to `/auth/change-password`. Handled uniformly for both standard Staff and Admin users without restrictive session blocking.
    - **Smooth Initialization & Error Recovery**: Initializing state displays a loading indicator to eliminate UI flashes, with clear fallbacks for expired token recovery.
- **Auto-Save on Lifecycle Actions**: Clicking "Activate Staff", "Invite to Portal", or "Deactivate" automatically persists any pending form changes before executing the lifecycle operation and synchronizes dirty tracker state (`isDirty = false`). This prevents data loss and avoids unnecessary manual save prompts when an admin edits a staff record and activates it.
- **My Roster**: Personalized staff view of upcoming commitments.
  - **Personalized Filtering**: Automatically filters the roster to only show Houses the staff member is actively assigned to.
  - **Robust Tracking**: Intelligent data mapping ensures participants and routines are correctly linked and displayed even across complex database relationships.
  - **Unified View**: Displays personal shifts, assigned events (meetings/outings), and approved leave in one consolidated calendar.
  - **Performance-First List View**: High-performance, paginated list view (50 records per page) optimized for staff with deep roster histories.
  - **Advanced Search & Sort**: Integrated DataGrid support allows staff to search and sort their entire shift history across multiple fields (date, template, house, notes).
  - **Staff Shift View**: Dedicated read-only dashboard for staff to view their assigned shifts with checklist previews and scheduler instructions.
- **Compliance Tracking**: Monitoring of mandatory NDIS checks and their expiry dates.
  - **Dynamic ID Configuration**: Centralized administrative interface to manage 100-point ID verification rules, including point values and expiry requirements for various document types.
  - **Enforced Attachments**: "Requires Document" toggle for compliance types that forces the collection of document reference numbers and file attachments (e.g., Comprehensive Car Insurance) during staff record updates.
  - **Contextual UI**: Inline document details and file uploaders integrated directly into the compliance checklist for streamlined data entry.
- **Training Records**: Tracking of staff training sessions and certifications.
- **Granular Document Management**: New document management system aligned with Participant Documents.
  - **Secure Storage**: Files are stored in `${staffId}/documents/` with strict RLS policies.
  - **Role-Based Overrides**: Administrators can override global role permissions for specific documents (e.g., restricting access to disciplinary records).
  - **Staged Uploads**: Documents are staged in a "Pending Changes" model, ensuring atomic-like updates during the staff saving process.
  - **Audit Trail**: Metadata such as `uploaded_by`, `file_size`, and `mime_type` are captured for all records.

## 3. Roster & Operations

The core operational engine of the care system.

- **House Shift Templates**: Define recurring house structures (Morning, Day, Night, etc.) with custom times, icons, and pre-linked checklist routines (e.g., "Morning Protocol + Handover"). Managed centrally via a dedicated administration page under the Roster Board.
- **Roster Auto-Fill**: Rapidly generate multi-week coverage by deploying house shift templates into the calendar with one click using the "Build Roster" tool.
- **Schedule Checklists**: Standalone tool to bulk schedule facility-wide checklists (e.g., "Weekly Deep Clean", "Vehicle Check") across multiple weeks independently of specific shifts.
- **Roster Board**: Visual representation of staff shifts and house assignments with intelligent staff filtering (showing active staff assigned to the house).
- **Shift Routines**: Automated, shift-locked task lists that staff must complete and sign off on during their active shift. Completion is enforced; staff cannot submit timesheets if mandatory shift routines are incomplete.
- **Shift Documentation Command Center**: A specialized hub for monitoring clinical compliance across all shifts.
  - **3-Status Model**: Precisely categorizes every shift as **Completed**, **Draft**, or **Overdue**.
  - **Compliance-First Filters**: Multi-select status buttons allow Admins and Staff to overlay documentation gaps, defaulting to 'Draft' and 'Overdue' filters.
  - **Visual Compliance Strips**: High-density color indicators on every row for millisecond-level status recognition.
- **Enhanced Clinical Notes**: Comprehensive clinical documentation completed at the end of every shift.
  - **Centralized Management**: Shift notes are managed exclusively via the Shift Notes module. Direct creation from Participant Detail pages is disabled to ensure all notes are correctly linked to rostered shifts.
  - **Structured Tracking**: Dedicated sections for Risks, Overall Presentation, ADL Supports, Domestic Tasks, and Capacity Building goals.
  - **Interactive Binary Inputs**: All Yes/No fields (Risks, PBS, Medication, Trackers) use high-clarity Radio Button Groups for faster, more accurate entry.
  - **Health & Medication**: Integrated logging of regular and PRN medication statuses with prompt-based guidance.
  - **Positive Behaviour Support (PBS)**: Detailed tracking of PBS strategies, timing, and outcomes.
  - **Modular Clinical Trackers**: Toggleable, event-based trackers driven by a **"Preference-Driven Visibility, Data-Driven Occurrence"** logic:
    - **Visibility**: Sidebar links and tracker sections are shown only if enabled in the Participant Care Plan.
    - **Occurrence**: Flags (e.g. `seizure_occurred`) are derived automatically from the presence of data, preventing documentation "false positives".
    - **Bowel Tracking**: Featuring a visual Bristol Scale picker (1-7), time, and amount logging.
    - **Seizure Activity**: Detailed logs of time, duration, and type.
    - **Sleep Tracking**: Day/Night quality and support needs.
    - **Behaviour Observations**: Intensity and type tracking.
    - **Mealtime Management (MTM)**: Advanced tracking with **Conditional Integrity Checks**. Automatically forces detailed documentation if texture, consistency, or positioning requirements aren't met, or if specific supervision is required.
    - **Hygiene & Community**: Support levels and engagement tracking.
  - **Clinical Tracker Management**: Centralized administrative interface for all clinical dropdown options (Seizure Types, Behaviour Types, Sleep Quality, etc.) at **Admin > Clinical Trackers**.
  - **Automation**: Automatic shift type detection from roster templates and Care Plan data injection.
  - **Multi-Participant Shift Notes Uniqueness**: Partial unique index protection enforces one active or draft note per staff, shift, and participant. This prevents duplicate note submissions while ensuring staff members can successfully submit separate shift notes for multiple different participants assigned to the exact same shift.
- **Overnight Shift Logic**: Intelligent date-range querying ensures that overnight shifts (starting yesterday but ending today) are correctly recognized in "Today's" views and "Active Shift" detection.
- **Smart Timesheets**: Proactive timesheet management system.
  - **Missing Shift Detection**: Automatically identifies completed shifts that are missing timesheets and flags them for creation.
  - **Robust Submission**: Optimized submission flow prevents autosave race conditions, ensuring a single click successfully transitions a timesheet from draft to pending.
  - **No Shift Note Blocking**: Shift note completion is no longer enforced at the time of timesheet submission, allowing independent completion.
  - **Audit Trail Visibility**: Staff can now view a full read-only version of their submitted timesheets exactly as they were reported.
  - **Action-Oriented Alerts**: The Staff Dashboard displays high-visibility prompts when timesheets are required for past work.
  - **Consolidated Tracking**: Real-time visibility across Needs Submission (Drafts/Missing), Awaiting Approval, Approved, and Rejected states with tab state persistence.

## 4. Leave Management

Integrated system for managing staff unavailability and holiday requests.

- **Request Workflow**: Staff can submit leave requests with specific types, date ranges, reasons, and supporting documentation (attachments).
- **Calendar Integration**: Approved and pending leave blocks are visible directly on the Roster Board, House Calendar, and personal "My Roster" views.
- **Visibility Toggles**: Modern switch toggles allow managers and staff to show/hide leave blocks to manage visual clutter.
- **Interactive Editing**: Ability to edit or cancel leave requests directly by clicking the leave blocks on any calendar view.
- **Conflict Detection**: Real-time validation that warns staff if they are requesting leave that overlaps with their existing rostered shifts.

## 5. House & Facility Management

Management of the physical locations where care is provided.

- **Enhanced House Profiles**: Centralized management of facility-specific clinical and operational details.
  - **Risk Management**: Dedicated section for tracking house-level risks, environmental alerts, and interaction strategies.
  - **Participant Context**: Qualitative breakdown of individuals and social dynamics within the house to improve care quality and safety.
  - **House Intelligence**: Consolidated views for general house details, routines, and staff observations.
  - **Resources**: Repository for house-specific contacts, emergency procedures, and operational guides.
    - **Modern UI**: Streamlined interface with specific file icons (PDF, Word, etc.) and single-click downloads.
    - **Soft Delete**: Integrated "Active Only" filtering and deactivation workflow to maintain audit trails while keeping active views clean.
    - **Security**: Supports secure document attachments stored in Supabase with house-level RLS.
- **Setup Wizard**: Interactive guide for configuring shift templates and facility routines.
- **House Directory**: Searchable list view with real-time occupancy tracking and deep links to participant profiles.
- **Checklists**: Recurring operational tasks for house maintenance and compliance. Bulk scheduling incorporates strict unsaved ID safeguards, preventing scheduling errors for checklists pending save.
- **Unified 'Pending Save' Staging Model**: Standardized badge (`Pending save`), button (`Save` / `Save Changes`), and toast feedback across all child section forms (Houses, Staff, and Participants), giving clear visual confirmation when items are staged prior to clicking the primary toolbar "Save Changes" button.
- **House Calendar**: Centralized hub for all house activities.
- **Forms**: Data collection forms for various house-related activities.
- **House Files**: General document management for regulatory and facility records.

## 5. Compliance & Audit

System-wide tools for ensuring regulatory and operational standards.

- **Activity Log**: Audit trail for all data modifications.
- **Incident Reporting**: Integration with shift notes and timesheets for tracking incidents.
- **Compliance Banners**: Visual indicators for expiring documents or pending actions.

## 6. Dashboards

- **Management Dashboard**: High-level overview of occupancy, staffing levels, and compliance status.
- **Staff Dashboard**: Personalized view of upcoming shifts, tasks, and notifications.
  - **Upcoming Schedule**: Chronological merge of rostered shifts and assigned calendar events (meetings, training, community outings) with period-specific icons and colors.
  - **Proactive Alerts**: High-visibility cards for missing timesheets, expiring compliance items, and urgent shift routines.
  - **Overnight Awareness**: Active shift detection accurately identifies work-in-progress across calendar day boundaries.

## 7. Notification Center

Comprehensive alert system for critical updates and workflows.

- **Deep Linking**: Notifications navigate directly to relevant pages and auto-scroll to specific sections (e.g., Clinical Updates scroll to the Medications section).
- **Role-Based Alerts**: Automated triggers for leave requests, timesheet approvals, roster changes, and compliance expiries.
- **Real-time Sync**: Uses Supabase Realtime for instant in-app alerts and topbar toasts.
- **Activity Correlation**: Integrated with the Activity Log to provide context for clinical updates.

## 8. Security & RBAC

- **Granular Permissions**: System-wide support for module-specific access levels (Full, Context-Read/Write, Context-Read-Only, Read-Only, None).
- **Hierarchical Module Security**: Specialized grouping for **Houses**, **Participant Records**, and **Staff Profiles**, allowing independent control over specific sections (e.g., Medications, Compliance, Employment).
- **Inclusive Entry Logic**: Smart routing that allows access to a module if a user has any relevant sub-permission, ensuring they can manage authorized data even if parent access is restricted.
- **Visual Locking**: Intuitive UI that "ghost-locks" dependent sub-permissions when a parent gateway is disabled, guiding administrators toward logical configurations.
- **JWT-Driven RLS**: High-performance database security that enforces these granular rules directly at the data layer using Supabase Row Level Security.

## 9. Incident Report Management

Comprehensive module for lodging, managing, and resolving clinical and operational incidents.

- **Structured Reporting**: Specialized form for detailed incident accounts, including severity, priority, and structured classifications. Includes visual confirmation with participant and staff avatars in dropdowns and the "Reported By" section.
- **Restrictive Practice Compliance**: Integrated tracking of Restrictive Practices (Seclusion, Restraint, etc.) with mandatory NDIS-compliant fields (start/end times, triggers, outcomes).
- **NDIS Integration**: Dedicated flagging for NDIS Reportable incidents with administrative oversight.
- **Admin Review Console**: RBAC-guarded interface for administrators to review, action, and close incident reports with a full audit trail. Features a high-performance DataGrid with:
  - **Interactive Navigation**: Primary edit action centralized on the **Date & Time** field (Steel Blue, hand cursor).
  - **Visual Recognition**: Dedicated columns for Participant and Staff with profile avatars and deep links.
  - **Optimized Layout**: Pinned context columns and responsive horizontal scrolling.
- **Contextual Search & Filter**: High-performance DataGrid allowing filtering by Participant, Staff, Status, Severity, and Date range.
- **Master List Integration**: Centrally managed Incident and Restrictive Practice types to ensure data consistency.
- **Incident Reference ID**: Main list table presents the human-readable **Incident ID** in the first pinned column. Clicking the ID or date transitions to the detail view.
- **Single Incident Print Layout**: Form view includes a **"Print Preview"** action which renders a print-optimized layout of all incident record fields (Overview details, full narrative description, witnesses, notified parties, restrictive practices start/end/triggers/observed behaviours, NDIS report status, administrative oversight actions, and clinical manager signature sign-offs).
- **URL Routing & Bookmarking**: derived view state directly handles URL search parameters (`?id=uuid`, `?mode=new`, `?print=true`), allowing direct link sharing and browser bookmarking of specific incident records.

## 10. Reporting Hub

Central registry for system-wide analytics and compliance exports.

- **Incident Management Report**: Provides a comprehensive, chronological view of all clinical incidents with advanced date filtering (preset periods and custom ranges) and print-optimized PDF layouts. Cleanly links incidents to specific participants and staff.
- **Single Participant Profile Report**: Creates custom print-ready clinical reports for a chosen participant.
  - **Exact Field Alignment**: Form field names, labels, and table layouts match the Participant Detail page tabs precisely (including required fields with asterisks, such as "Full Name \*", and clinical plans like the "Mental Health Plan" or "Medical Plan").
  - **Criteria Persistence**: Toggled sections checklist and selected participant selection automatically save to the database (`ic_report_preferences`) for the logged-in staff member, instantly restoring their workspace parameters when they reload the page.
  - **Status Highlighting**: Displays the participant's secure avatar in the selection list, highlighting inactive or draft participants using styled status badges.
- **Extensible Architecture**: Designed to seamlessly integrate future clinical, operational, and financial reports, utilizing visual locks for reports currently under development.
- **Compliance Monitoring Report**: Advanced refactored organizational audit featuring:
  - **Exception-First Focus**: Defaults to actionable risks (Expired, Missing, Expiring Soon, In Progress) to streamline risk management.
  - **Granular Filtering**: Slice data by specific House or individual Staff Member.
  - **Flexible Grouping**: Pivot report views by Staff Member or Requirement Type for varied audit perspectives.
  - **Persistence**: User filter and grouping preferences are saved to the database, ensuring a consistent workspace upon return.
  - **Print Optimized**: Clean, professional layout with summary KPIs and organizational parameters, designed for regulatory compliance audits.
  - **Remediation Integration**: Deep links from report rows directly to staff compliance profiles for immediate resolution of gaps.

## 11. Public Landing Page & Redirection Routing

The public gateway and session listener structure.

- **Public Landing Page (`/`)**: A modern, high-fidelity landing page detailing the platform's core operational capabilities (Houses, Rostering, Staff App, Checklists, Compliance, and Reporting). Built with clean responsive design and dark mode support.
- **Session Redirection Listener**: Uses a session provider hook (`useAuth()`) to detect active user sessions. To prevent layout flashes, the page remains blocked with a `<ScreenLoader />` while auth context status resolves. Once resolved, authenticated users are dynamically routed to their target dashboard:
  - **Administrators**: Redirected to the central Admin Dashboard (`/dashboard`).
  - **Support Staff**: Redirected to the Worker Dashboard (`/my-dashboard`).
- **Route Separation**: Moving the default admin landing page to a protected `/dashboard` path keeps unauthenticated visitors from accessing internal layouts, ensuring total data boundary isolation.
- **Production Environment Hardening**: The Sign In page's quick-login bypass buttons ("Prod Admin", "Prod Support") have been permanently removed. Dev-only test accounts (Admin, Support Worker, Supervisor, House Manager, Director, Finance Manager) remain visible strictly when `VITE_APP_ENV !== 'production'`, with no shortcuts for production environments.

## 12. White-Labeled Resend Auth & Email Delivery

The application implements a white-labeled, zero-leak email architecture powered by **Resend** and Supabase Edge Functions.

- **Domain Isolation (`insidecare.app`)**: All staff invitations and password reset requests generate clean, domain-matching action links pointing to `https://insidecare.app/auth/confirm` (or `http://localhost:5173/auth/confirm` during dev), completely hiding any `supabase.co` backend URLs.
- **Resend Edge Functions**: Email delivery is handled directly by dedicated TypeScript Supabase Edge Functions (`ic-invite-staff-user`, `ic-send-password-reset`) invoking the Resend REST API via `IC_RESEND_API_KEY`.
- **Unified Email Design System**: All notification emails utilize a standardized HTML template (`renderEmailTemplate`) with centered card formatting, custom typography, brand header logos, and primary action buttons.
- **Header Topbar Elevation (`z-30`)**: Fixed header layouts feature an elevated `z-30` stacking context, ensuring that topbar components (User Avatar Dropdown and Notification Sheet) remain fully interactive and unobscured by sticky page headers or sidebars.
- **Client Confirmation Route (`/auth/confirm`)**: A dedicated `<ConfirmPage />` component extracts single-use token hashes (`token_hash`), validates them with `supabase.auth.verifyOtp`, and safely navigates users to `/auth/change-password` without risk of open-redirect vulnerabilities.
