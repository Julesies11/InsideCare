# InsideCare Features & Modules

This document provides a brief overview of the major modules and features in the InsideCare application.

## 1. Participant Management
Central hub for all information related to care recipients.
- **Profiles**: Comprehensive views of personal information, medical history, and goals.
- **Medication Register**: Centralized master list of all medications used in care. Supports server-side pagination (50 per page), remote sorting, and category filtering. Provides an administrative interface for clinical guidance (side effects, interactions).
- **Child Entities**: Detailed management of medications, documents, goals, notes, funding, contacts, hygiene routines, and restrictive practices.
- **Optimized Saving**: Uses `json-diff-ts` to only update changed fields.

## 2. Staff Management
Management of care providers and support staff.
- **Profiles**: Personal and professional information, qualifications, and certifications.
- **My Roster**: Personalized staff view of upcoming commitments.
    - **Personalized Filtering**: Automatically filters the roster to only show Houses the staff member is actively assigned to.
    - **Robust Tracking**: Intelligent data mapping ensures participants and routines are correctly linked and displayed even across complex database relationships.
    - **Unified View**: Displays personal shifts, assigned events (meetings/outings), and approved leave in one consolidated calendar.
    - **Performance-First List View**: High-performance, paginated list view (50 records per page) optimized for staff with deep roster histories.
    - **Advanced Search & Sort**: Integrated DataGrid support allows staff to search and sort their entire shift history across multiple fields (date, template, house, notes).
    - **Staff Shift View**: Dedicated read-only dashboard for staff to view their assigned shifts with checklist previews and scheduler instructions.
- **Compliance Tracking**: Monitoring of mandatory NDIS checks and their expiry dates.
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
- **Enhanced Clinical Notes**: Comprehensive clinical documentation completed at the end of every shift. Includes:
    - **Structured Tracking**: Dedicated sections for Risks, Overall Presentation, ADL Supports, Domestic Tasks, and Capacity Building goals.
    - **Health & Medication**: Integrated logging of regular and PRN medication statuses with prompt-based guidance.
    - **Positive Behaviour Support (PBS)**: Detailed tracking of PBS strategies, timing, and outcomes.
    - **Modular Clinical Trackers**: Toggleable, event-based trackers for:
        - **Bowel Tracking**: Featuring a visual Bristol Scale picker (1-7), time, and amount logging.
        - **Seizure Activity**: Detailed logs of time, duration, and type (linked to master list).
        - **Sleep Tracking**: Day/Night quality and support needs.
        - **Behaviour Observations**: Intensity and type tracking (linked to master list).
        - **Nutrition & Mealtime**: Detailed intake tracking and auto-population of Mealtime Management plans from participant profiles.
        - **Hygiene & Community**: Support levels and engagement tracking.
    - **Master List Management**: Integrated administrative dialogs to manage Seizure and Behaviour types (matching Medication Register patterns).
    - **Automation**: Automatic shift type detection from roster templates and Care Plan data injection.
- **Overnight Shift Logic**: Intelligent date-range querying ensures that overnight shifts (starting yesterday but ending today) are correctly recognized in "Today's" views and "Active Shift" detection.
- **Smart Timesheets**: Proactive timesheet management system.
    - **Missing Shift Detection**: Automatically identifies completed shifts that are missing timesheets and flags them for creation.
    - **Robust Submission**: Optimized submission flow prevents autosave race conditions, ensuring a single click successfully transitions a timesheet from draft to pending.
    - **Clinical Documentation Blocking**: Enforces completion of comprehensive Shift Notes before a timesheet can be submitted, guaranteeing critical clinical context is always recorded.
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
    - **Resources**: Repository for house-specific contacts, emergency procedures, and operational guides. Supports document attachments (PDF, Docs, Images) stored securely in Supabase.
- **Setup Wizard**: Interactive guide for configuring shift templates and facility routines.
- **House Directory**: Searchable list view with real-time occupancy tracking and deep links to participant profiles.
- **Checklists**: Recurring operational tasks for house maintenance and compliance.
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

## 9. Reporting Hub
Central registry for system-wide analytics and compliance exports.
- **Incident Management Report**: Provides a comprehensive, chronological view of all clinical incidents with advanced date filtering (preset periods and custom ranges) and print-optimized PDF layouts. Cleanly links incidents to specific participants and staff.
- **Extensible Architecture**: Designed to seamlessly integrate future clinical, operational, and financial reports, utilizing visual locks for reports currently under development.
