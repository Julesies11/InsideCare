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
- **Compliance Tracking**: Monitoring of mandatory NDIS checks and their expiry dates.
- **Training Records**: Tracking of staff training sessions and certifications.
- **Document Management**: Management of employee documents (ID, insurance, etc.).

## 3. Roster & Operations
The core operational engine of the care system.
- **House Shift Types**: Define recurring house structures (Morning, Day, Night, etc.) with custom times, icons, and pre-linked checklist routines (e.g., "Morning Protocol + Handover").
- **Roster Auto-Fill**: Rapidly generate multi-week coverage by deploying house shift models into the calendar with one click using the "Publish Roster" (Populate) tool.
- **Roster Board**: Visual representation of staff shifts and house assignments with intelligent staff filtering (showing active staff assigned to the house).
- **Shift Routines**: Automated, shift-locked task lists that staff must complete and sign off on during their active shift.
- **Timesheets**: Integration with actual worked hours and manager approval workflow.

## 4. House & Facility Management
Management of the physical locations where care is provided.
- **House Profiles**: Information about capacity, occupancy, and facility details.
- **Setup Wizard**: Interactive guide for configuring shift models, templates, and facility routines.
- **Checklists**: Recurring operational tasks for house maintenance and compliance.
- **Calendar**: House-specific events, appointments, and shared collaborative tasks.
- **Forms**: Data collection forms for various house-related activities.

## 5. Compliance & Audit
System-wide tools for ensuring regulatory and operational standards.
- **Activity Log**: Audit trail for all data modifications.
- **Incident Reporting**: Integration with shift notes and timesheets for tracking incidents.
- **Compliance Banners**: Visual indicators for expiring documents or pending actions.

## 6. Dashboards
- **Management Dashboard**: High-level overview of occupancy, staffing levels, and compliance status.
- **Staff Dashboard**: Personalized view of upcoming shifts, tasks, and notifications.

## 7. Notification Center
Comprehensive alert system for critical updates and workflows.
- **Deep Linking**: Notifications navigate directly to relevant pages and auto-scroll to specific sections (e.g., Clinical Updates scroll to the Medications section).
- **Role-Based Alerts**: Automated triggers for leave requests, timesheet approvals, roster changes, and compliance expiries.
- **Real-time Sync**: Uses Supabase Realtime for instant in-app alerts and topbar toasts.
- **Activity Correlation**: Integrated with the Activity Log to provide context for clinical updates.
