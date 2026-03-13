# InsideCare Database Schema Overview

This document provides an overview of the core database tables and their relationships in the InsideCare application.

## Core Entities

### 1. Participants (`public.participants`)
The central entity representing the individuals receiving care.
- **Key Fields:** `id`, `name`, `email`, `house_id`, `status` (`active`, `draft`, etc.), `ndis_number`, `support_level`.
- **Relationships:** Belongs to a House (`house_id`). Has many Notes, Medications, Goals, Documents, etc.

### 2. Staff (`public.staff`)
The employees providing care.
- **Key Fields:** `id`, `name`, `email`, `role_id`, `status`, `auth_user_id` (links to Supabase Auth).
- **Relationships:** Belongs to a Department. Assigned to many Houses.

### 3. Houses (`public.houses`)
The care facilities/locations.
- **Key Fields:** `id`, `name`, `branch_id`, `capacity`, `current_occupancy`.
- **Relationships:** Belongs to a Branch. Has many Participants and Staff assignments.

## Child Entities (Participant-related)

- **`participant_medications`**: Tracks medications, dosage, and frequency. Linked to `medications_master`.
- **`participant_goals` & `participant_goal_progress`**: Tracks care goals and their progress.
- **`participant_notes`**: General and important notes about the participant.
- **`participant_documents`**: Files uploaded for the participant.
- **`participant_contacts`**: External contacts (GP, Pharmacy, Support Coordinator).
- **`participant_funding`**: Tracks NDIS or other funding sources and balances.
- **`participant_hygiene_routines`**: Specific care routines.
- **`participant_restrictive_practices`**: Compliance-critical care instructions.

## Operational Tables

### Roster & Shifts
- **`staff_shifts`**: Scheduled shifts for staff at specific houses.
- **`timesheets`**: Actual hours worked, linked to a shift. Includes clock-in/out and manager approval.
- **`shift_notes`**: Notes recorded during a specific shift about a participant.

### Checklists & Forms
- **`checklist_master` & `checklist_item_master`**: Templates for recurring tasks.
- **`house_checklists` & `house_checklist_items`**: Checklists assigned to specific houses.
- **`house_forms` & `house_form_submissions`**: Custom forms for data collection.

### Compliance & Training
- **`staff_compliance`**: Tracks mandatory checks (NDIS Worker Screening, etc.).
- **`staff_training`**: Records of training completed by staff.
- **`staff_documents`**: Files like ID, certificates, etc.

## System Tables

- **`activity_log`**: Audit trail for all changes in the system.
- **`roles`**: RBAC permissions for staff.
- **`departments` & `branches`**: Organizational structure.

## Data Rules

- **Logic in TS**: No complex triggers or procedures in the database. Transformations and joins are handled in the React application.
- **Master Tables**: Heavy use of "Master" tables (e.g., `medications_master`, `contact_types_master`) to maintain consistent options across the system.
- **Soft Delete/Status**: Most entities use a `status` field or `is_active` flag rather than hard deletion.
- **Activity Logging**: Most `INSERT`/`UPDATE`/`DELETE` operations should be accompanied by an entry in the `activity_log`.
