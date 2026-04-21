# InsideCare Features & Modules

This document provides a brief overview of the major modules and features in the InsideCare application.

## 1. Participant Management
Central hub for all information related to care recipients.
- **Profiles**: Comprehensive views of personal information, medical history, and goals.
- **Child Entities**: Detailed management of medications, documents, goals, notes, funding, contacts, hygiene routines, and restrictive practices.
- **Optimized Saving**: Uses `json-diff-ts` to only update changed fields.

## 2. Staff Management
Management of care providers and support staff.
- **Profiles**: Personal and professional information, qualifications, and certifications.
- **My Roster**: Personalized staff view of upcoming commitments.
    - **Personalized Filtering**: Automatically filters the roster to only show Houses the staff member is actively assigned to.
    - **Robust Tracking**: Intelligent data mapping ensures participants and routines are correctly linked and displayed even across complex database relationships.
    - **Unified View**: Displays personal shifts, assigned events (meetings/outings), and approved leave in one consolidated calendar.
- **Compliance Tracking**: Monitoring of mandatory NDIS checks and their expiry dates.
- **Training Records**: Tracking of staff training sessions and certifications.
- **Document Management**: Management of employee documents (ID, insurance, etc.).

## 3. Roster & Operations
The core operational engine of the care system.
- **House Shift Templates**: Define recurring house structures (Morning, Day, Night, etc.) with custom times, icons, and pre-linked checklist routines (e.g., "Morning Protocol + Handover").
- **Roster Auto-Fill**: Rapidly generate multi-week coverage by deploying house shift templates into the calendar with one click using the "Build Roster" tool.
- **Schedule Checklists**: Standalone tool to bulk schedule facility-wide checklists (e.g., "Weekly Deep Clean", "Vehicle Check") across multiple weeks independently of specific shifts.
- **Roster Board**: Visual representation of staff shifts and house assignments with intelligent staff filtering (showing active staff assigned to the house).
- **Shift Routines**: Automated, shift-locked task lists that staff must complete and sign off on during their active shift. Completion is enforced; staff cannot submit timesheets if mandatory shift routines are incomplete.
- **Overnight Shift Logic**: Intelligent date-range querying ensures that overnight shifts (starting yesterday but ending today) are correctly recognized in "Today's" views and "Active Shift" detection.
- **Smart Timesheets**: Proactive timesheet management system.
    - **Missing Shift Detection**: Automatically identifies completed shifts that are missing timesheets and flags them for creation.
    - **Robust Submission**: Optimized submission flow prevents autosave race conditions, ensuring a single click successfully transitions a timesheet from draft to pending.
    - **Action-Oriented Alerts**: The Staff Dashboard displays high-visibility prompts when timesheets are required for past work.
    - **Consolidated Tracking**: Real-time visibility across Needs Submission (Drafts/Missing), Awaiting Approval, Approved, and Rejected states.

## 4. Leave Management
Integrated system for managing staff unavailability and holiday requests.
- **Request Workflow**: Staff can submit leave requests with specific types, date ranges, reasons, and supporting documentation (attachments).
- **Calendar Integration**: Approved and pending leave blocks are visible directly on the Roster Board, House Calendar, and personal "My Roster" views.
- **Visibility Toggles**: Modern switch toggles allow managers and staff to show/hide leave blocks to manage visual clutter.
- **Interactive Editing**: Ability to edit or cancel leave requests directly by clicking the leave blocks on any calendar view.
- **Conflict Detection**: Real-time validation that warns staff if they are requesting leave that overlaps with their existing rostered shifts.

## 5. House & Facility Management
Management of the physical locations where care is provided.
- **House Profiles**: Information about capacity, occupancy, and facility details.
- **Setup Wizard**: Interactive guide for configuring shift templates and facility routines.
- **Checklists**: Recurring operational tasks for house maintenance and compliance.
- **House Calendar**: Centralized hub for all house activities.
    - **Integrated View**: Displays rostered shifts, scheduled checklists, and general events (Meetings, Appointments) in a single unified view.
    - **Multi-Assignment**: General events support multiple assigned staff and participants using a robust many-to-many junction table architecture.
    - **Quick Assign**: Ability to assign staff to "Open" shifts directly from the calendar view.
- **Forms**: Data collection forms for various house-related activities.

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
