import { MenuItemConfig } from '@/layouts/demo1/sidebar/SidebarMenu';
import {
  Activity,
  BarChart3,
  Calendar,
  CheckSquare,
  ClipboardList,
  Clock,
  Home,
  LogOut,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { ROUTES } from '@/config/routes.config';
import { RBAC_MODULES } from './rbac-modules';

export const MENU_SIDEBAR: MenuItemConfig[] = [
  {
    title: 'My Dashboard',
    icon: Home,
    path: ROUTES.MY_DASHBOARD,
  },
  {
    heading: 'Staff Portal',
    permission: [
      RBAC_MODULES.SHIFT_ROUTINES,
      RBAC_MODULES.HOUSE_CHECKLISTS,
      RBAC_MODULES.MY_ROSTER,
      RBAC_MODULES.MY_LEAVE,
      RBAC_MODULES.MY_TIMESHEETS,
    ],
  },
  {
    title: 'House Checklists',
    icon: CheckSquare,
    path: ROUTES.MY_CHECKLISTS,
    permission: RBAC_MODULES.HOUSE_CHECKLISTS,
  },
  {
    title: 'My Roster',
    icon: Calendar,
    path: ROUTES.MY_ROSTER,
    permission: RBAC_MODULES.MY_ROSTER,
  },
  {
    title: 'My Leave',
    icon: LogOut,
    path: ROUTES.MY_LEAVE,
    permission: RBAC_MODULES.MY_LEAVE,
  },
  {
    title: 'My Timesheets',
    icon: Clock,
    path: ROUTES.MY_TIMESHEETS,
    permission: RBAC_MODULES.MY_TIMESHEETS,
  },
  {
    heading: 'People & Houses',
    permission: [
      RBAC_MODULES.EMPLOYEES,
      RBAC_MODULES.HOUSES,
      RBAC_MODULES.PARTICIPANTS,
      RBAC_MODULES.REPORTING_CLINICAL,
    ],
  },
  {
    title: 'Staff',
    icon: UserCheck,
    path: ROUTES.STAFF,
    permission: RBAC_MODULES.EMPLOYEES,
  },
  {
    title: 'Houses',
    icon: Home,
    path: ROUTES.HOUSES,
    permission: RBAC_MODULES.HOUSES,
  },
  {
    title: 'Participants',
    icon: Users,
    permission: RBAC_MODULES.PARTICIPANTS,
    children: [
      {
        title: 'Participant Profiles',
        path: ROUTES.PARTICIPANT_PROFILES,
        permission: RBAC_MODULES.PARTICIPANTS,
      },
      {
        title: 'Medication Register',
        path: ROUTES.MEDICATION_REGISTER,
        permission: RBAC_MODULES.MASTER_LISTS,
      },
      {
        title: 'Shift Notes',
        path: ROUTES.SHIFT_NOTES,
        permission: RBAC_MODULES.SHIFT_NOTES,
      },
    ],
  },
  {
    title: 'Incidents',
    icon: ShieldAlert,
    path: ROUTES.INCIDENT_REPORT,
    permission: RBAC_MODULES.REPORTING_CLINICAL,
  },
  {
    heading: 'Roster & Staff Scheduling',
    permission: [
      RBAC_MODULES.ROSTER_BOARD,
      RBAC_MODULES.TIMESHEETS,
      RBAC_MODULES.LEAVE_REQUESTS,
    ],
  },
  {
    title: 'Roster Board',
    icon: Calendar,
    path: ROUTES.ROSTER_BOARD,
    permission: RBAC_MODULES.ROSTER_BOARD,
  },
  {
    title: 'Shift Setup',
    icon: ClipboardList,
    path: ROUTES.SHIFT_SETUP,
    permission: RBAC_MODULES.ROSTER_BOARD,
  },
  {
    title: 'Timesheet Approvals',
    icon: ClipboardList,
    path: ROUTES.TIMESHEET_APPROVALS,
    permission: RBAC_MODULES.TIMESHEETS,
  },
  {
    title: 'Leave Approvals',
    icon: ClipboardList,
    path: ROUTES.LEAVE_APPROVALS,
    permission: RBAC_MODULES.LEAVE_REQUESTS,
  },
  {
    heading: 'Administration',
    permission: [
      RBAC_MODULES.ACCESS_CONTROL,
      RBAC_MODULES.ACTIVITY_LOG,
      RBAC_MODULES.REPORTING_CLINICAL,
      RBAC_MODULES.REPORTING_OPERATIONAL,
      RBAC_MODULES.REPORTING_COMPLIANCE,
      RBAC_MODULES.MASTER_LISTS,
    ],
  },
  {
    title: 'Access Control',
    icon: Settings,
    path: ROUTES.ACCESS_CONTROL,
    permission: RBAC_MODULES.ACCESS_CONTROL,
  },
  {
    title: 'Master Lists',
    icon: ClipboardList,
    permission: RBAC_MODULES.MASTER_LISTS,
    children: [
      {
        title: 'Clinical Trackers',
        path: ROUTES.CLINICAL_TRACKER_SETTINGS,
        permission: RBAC_MODULES.MASTER_LISTS,
      },
      {
        title: 'Leave Types',
        path: ROUTES.LEAVE_TYPES,
        permission: RBAC_MODULES.MASTER_LISTS,
      },
      {
        title: 'Checklist Templates',
        path: ROUTES.CHECKLIST_TEMPLATES,
        permission: RBAC_MODULES.ACCESS_CONTROL,
      },
    ],
  },
  {
    title: 'Reporting',
    icon: BarChart3,
    path: ROUTES.REPORTING,
    permission: [
      RBAC_MODULES.REPORTING_CLINICAL,
      RBAC_MODULES.REPORTING_OPERATIONAL,
      RBAC_MODULES.REPORTING_COMPLIANCE,
    ],
  },
  {
    title: 'Compliance',
    icon: ShieldCheck,
    permission: RBAC_MODULES.ADMIN_COMPLIANCE,
    children: [
      {
        title: 'Compliance Monitoring',
        path: ROUTES.COMPLIANCE_MONITORING,
        permission: RBAC_MODULES.ADMIN_COMPLIANCE,
      },
      {
        title: 'Compliance Settings',
        path: ROUTES.COMPLIANCE_SETTINGS,
        permission: RBAC_MODULES.ADMIN_COMPLIANCE,
      },
    ],
  },
  {
    title: 'Onboarding',
    icon: ClipboardList,
    permission: RBAC_MODULES.ADMIN_ONBOARDING,
    children: [
      {
        title: 'Onboarding Monitoring',
        path: ROUTES.ONBOARDING_MONITORING,
        permission: RBAC_MODULES.ADMIN_ONBOARDING,
      },
      {
        title: 'Onboarding Settings',
        path: ROUTES.ONBOARDING_SETTINGS,
        permission: RBAC_MODULES.ADMIN_ONBOARDING,
      },
    ],
  },
  {
    title: 'Activity Log',
    icon: Activity,
    path: ROUTES.ACTIVITY_LOG,
    permission: RBAC_MODULES.ACTIVITY_LOG,
  },
];
