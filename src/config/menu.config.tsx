import {
  Calendar,
  ClipboardList,
  House,
  LayoutGrid,
  Umbrella,
  Users as PeopleIcon,
  Settings,
} from 'lucide-react';
import { type MenuConfig } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  { heading: 'Main' },
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/',
    roles: ['admin'],
  },
  {
    title: 'My Dashboard',
    icon: LayoutGrid,
    path: '/staff/dashboard',
    roles: ['staff'],
    permission: 'shift_routines', // Staff view their routines
  },
  {
    title: 'My Checklists',
    icon: ClipboardList,
    path: '/staff/checklists',
    roles: ['staff'],
    permission: 'house_checklists',
  },
  {
    title: 'My Roster',
    icon: Calendar,
    path: '/staff/roster',
    roles: ['staff'],
    permission: 'roster_board',
  },
  {
    title: 'Leave Requests',
    icon: Umbrella,
    path: '/staff/leave',
    roles: ['staff'],
    permission: 'leave_requests',
  },
  {
    title: 'My Timesheets',
    icon: ClipboardList,
    path: '/staff/timesheets',
    roles: ['staff'],
    permission: 'timesheets_submit',
  },
  {
    title: 'Participants',
    icon: PeopleIcon,
    roles: ['admin'],
    permission: 'participant_profiles',
    children: [
      { title: 'Participant Profiles', path: '/participants/profiles', permission: 'participant_profiles' },
      {
        title: 'Participant Detail',
        path: '/participants/detail',
        hidden: true,
        permission: 'participant_profiles',
        children: [{ title: 'Detail', path: '/participants/detail/:id', permission: 'participant_profiles' }],
      },
      { title: 'Shift Notes', path: '/participants/shift-notes', permission: 'shift_notes' },
    ],
  },
  {
    title: 'Employees',
    icon: PeopleIcon,
    roles: ['admin'],
    permission: 'staff_profiles',
    children: [
      { title: 'Staff Profiles', path: '/employees/staff-profiles', permission: 'staff_profiles' },
      {
        title: 'Staff Detail',
        path: '/employees/staff-detail',
        hidden: true,
        permission: 'staff_profiles',
        children: [{ title: 'Detail', path: '/employees/staff-detail/:id', permission: 'staff_profiles' }],
      },
      { title: 'Timesheets', path: '/employees/timesheets', roles: ['admin'], permission: 'timesheets_approve' },
      { title: 'Leave Requests', path: '/employees/leave-requests', roles: ['admin'], permission: 'leave_requests' },
    ],
  },
  {
    title: 'Houses',
    icon: House,
    roles: ['admin'],
    permission: 'house_profiles',
    children: [
      { title: 'House Profiles', path: '/houses/profiles', permission: 'house_profiles' },
    ],
  },
  {
    title: 'Roster Board',
    icon: Calendar,
    path: '/roster-board',
    roles: ['admin'],
    permission: 'roster_board',
  },
  { heading: 'Settings', roles: ['admin'] },
  {
    title: 'Roles & Permissions',
    icon: Settings,
    path: '/admin/roles',
    roles: ['admin'],
  },
];

export const MENU_SIDEBAR_CUSTOM: MenuConfig = [];
export const MENU_SIDEBAR_COMPACT: MenuConfig = [];
export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];
export const MENU_HELP: MenuConfig = [];
export const MENU_ROOT: MenuConfig = [];
