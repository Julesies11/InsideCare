import { 
  Home, 
  CheckSquare, 
  Calendar, 
  LogOut, 
  Clock, 
  Users, 
  Settings, 
  ClipboardList,
  Activity,
  UserCheck,
  BarChart3
} from 'lucide-react';
import { MenuItemConfig } from '@/layouts/demo1/sidebar/SidebarMenu';
import { RBAC_MODULES } from './rbac-modules';

export const MENU_SIDEBAR: MenuItemConfig[] = [
  {
    title: 'My Dashboard',
    icon: Home,
    path: '/my-dashboard',
  },
  {
    heading: 'Staff Portal',
    permission: [
      RBAC_MODULES.SHIFT_ROUTINES, 
      RBAC_MODULES.HOUSE_CHECKLISTS, 
      RBAC_MODULES.MY_ROSTER, 
      RBAC_MODULES.MY_LEAVE, 
      RBAC_MODULES.MY_TIMESHEETS
    ],
  },
  {
    title: 'House Checklists',
    icon: CheckSquare,
    path: '/my-checklists',
    permission: RBAC_MODULES.HOUSE_CHECKLISTS,
  },
  {
    title: 'My Roster',
    icon: Calendar,
    path: '/my-roster',
    permission: RBAC_MODULES.MY_ROSTER,
  },
  {
    title: 'My Leave',
    icon: LogOut,
    path: '/my-leave',
    permission: RBAC_MODULES.MY_LEAVE,
  },
  {
    title: 'My Timesheets',
    icon: Clock,
    path: '/my-timesheets',
    permission: RBAC_MODULES.MY_TIMESHEETS,
  },
  {
    heading: 'People & Houses',
    permission: [RBAC_MODULES.EMPLOYEES, RBAC_MODULES.HOUSES, RBAC_MODULES.PARTICIPANTS],
  },
  {
    title: 'Staff',
    icon: UserCheck,
    path: '/staff',
    permission: RBAC_MODULES.EMPLOYEES,
  },
  {
    title: 'Houses',
    icon: Home,
    path: '/houses',
    permission: RBAC_MODULES.HOUSES,
  },
  {
    title: 'Participants',
    icon: Users,
    permission: RBAC_MODULES.PARTICIPANTS,
    children: [
      { title: 'Participant Profiles', path: '/participants/profiles', permission: RBAC_MODULES.PARTICIPANTS },
      { title: 'Medication Register', path: '/participants/medication-register', permission: RBAC_MODULES.MASTER_LISTS },
      { title: 'Shift Notes', path: '/participants/shift-notes', permission: RBAC_MODULES.SHIFT_NOTES },
    ],
  },
  {
    heading: 'Roster & Staff Scheduling',
    permission: [RBAC_MODULES.ROSTER_BOARD, RBAC_MODULES.TIMESHEETS, RBAC_MODULES.LEAVE_REQUESTS],
  },
  {
    title: 'Roster Board',
    icon: Calendar,
    path: '/roster-board',
    permission: RBAC_MODULES.ROSTER_BOARD,
  },
  {
    title: 'Shift Setup',
    icon: ClipboardList,
    path: '/shift-setup',
    permission: RBAC_MODULES.ROSTER_BOARD,
  },
  {
    title: 'Timesheet Approvals',
    icon: ClipboardList,
    path: '/timesheet-approvals',
    permission: RBAC_MODULES.TIMESHEETS,
  },
  {
    title: 'Leave Approvals',
    icon: ClipboardList,
    path: '/leave-approvals',
    permission: RBAC_MODULES.LEAVE_REQUESTS,
  },
  { 
    heading: 'Administration', 
    permission: [
      RBAC_MODULES.ACCESS_CONTROL, 
      RBAC_MODULES.ACTIVITY_LOG,
      RBAC_MODULES.REPORTING_CLINICAL,
      RBAC_MODULES.REPORTING_OPERATIONAL,
      RBAC_MODULES.REPORTING_COMPLIANCE
    ] 
  },
  {
    title: 'Access Control',
    icon: Settings,
    path: '/access-control',
    permission: RBAC_MODULES.ACCESS_CONTROL,
  },
  {
    title: 'Checklist Templates',
    icon: ClipboardList,
    path: '/checklist-templates',
    permission: RBAC_MODULES.ACCESS_CONTROL,
  },
  {
    title: 'Reporting',
    icon: BarChart3,
    path: '/reporting',
    permission: [RBAC_MODULES.REPORTING_CLINICAL, RBAC_MODULES.REPORTING_OPERATIONAL, RBAC_MODULES.REPORTING_COMPLIANCE],
  },
  {
    title: 'Activity Log',
    icon: Activity,
    path: '/activity-log',
    permission: RBAC_MODULES.ACTIVITY_LOG,
  },
];
