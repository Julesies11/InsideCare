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
  UserCheck
} from 'lucide-react';
import { MenuItemConfig } from '@/layouts/demo1/sidebar/SidebarMenu';
import { RBAC_MODULES } from './rbac-modules';

export const MENU_SIDEBAR: MenuItemConfig[] = [
  {
    title: 'My Dashboard',
    icon: Home,
    path: '/staff/dashboard',
  },
  {
    heading: 'Staff Portal',
    permission: RBAC_MODULES.SHIFT_ROUTINES,
  },
  {
    title: 'House Checklists',
    icon: CheckSquare,
    path: '/staff/checklists',
    permission: RBAC_MODULES.HOUSE_CHECKLISTS,
  },
  {
    title: 'My Roster',
    icon: Calendar,
    path: '/staff/roster',
    permission: RBAC_MODULES.MY_ROSTER,
  },
  {
    title: 'My Leave',
    icon: LogOut,
    path: '/staff/leave',
    permission: RBAC_MODULES.MY_LEAVE,
  },
  {
    title: 'My Timesheets',
    icon: Clock,
    path: '/staff/timesheets',
    permission: RBAC_MODULES.MY_TIMESHEETS,
  },
  {
    heading: 'Participant Records',
    permission: RBAC_MODULES.PARTICIPANTS,
  },
  {
    title: 'Participants',
    icon: Users,
    permission: RBAC_MODULES.PARTICIPANTS,
    children: [
      { title: 'Participant Profiles', path: '/participants/profiles', permission: RBAC_MODULES.PARTICIPANTS },
      { title: 'Shift Notes', path: '/participants/shift-notes', permission: RBAC_MODULES.SHIFT_NOTES },
    ],
  },
  {
    heading: 'Employees & HR',
    permission: RBAC_MODULES.EMPLOYEES,
  },
  {
    title: 'Employees',
    icon: UserCheck,
    permission: RBAC_MODULES.EMPLOYEES,
    children: [
      { title: 'Staff Profiles', path: '/employees/staff-profiles', permission: RBAC_MODULES.EMPLOYEES },
      { title: 'Timesheets', path: '/employees/timesheets', permission: RBAC_MODULES.TIMESHEETS },
      { title: 'Leave Requests', path: '/employees/leave-requests', permission: RBAC_MODULES.LEAVE_REQUESTS },
    ],
  },
  {
    title: 'Roster Board',
    icon: Calendar,
    path: '/roster-board',
    permission: RBAC_MODULES.ROSTER_BOARD,
  },
  {
    heading: 'Operations & Facilities',
    permission: RBAC_MODULES.HOUSES,
  },
  {
    title: 'Houses',
    icon: Home,
    permission: RBAC_MODULES.HOUSES,
    children: [
      { title: 'House Profiles', path: '/houses/profiles', permission: RBAC_MODULES.HOUSES },
    ],
  },
  { heading: 'System Administration', permission: RBAC_MODULES.ACCESS_CONTROL },
  {
    title: 'Access Control',
    icon: Settings,
    path: '/admin/roles',
    permission: RBAC_MODULES.ACCESS_CONTROL,
  },
  {
    title: 'Checklist Templates',
    icon: ClipboardList,
    path: '/admin/checklist-templates',
    permission: RBAC_MODULES.ACCESS_CONTROL,
  },
  {
    title: 'Activity Log',
    icon: Activity,
    path: '/activity-log',
    permission: RBAC_MODULES.ACTIVITY_LOG,
  },
];
