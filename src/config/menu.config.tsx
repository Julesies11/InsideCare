import {
  Calendar,
  ClipboardList,
  House,
  LayoutGrid,
  Umbrella,
  Users as PeopleIcon,
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
  },
  {
    title: 'House Checklists',
    icon: ClipboardList,
    path: '/staff/checklists',
    roles: ['staff'],
  },
  {
    title: 'My Roster',
    icon: Calendar,
    path: '/staff/roster',
    roles: ['staff'],
  },
  {
    title: 'Leave Requests',
    icon: Umbrella,
    path: '/staff/leave',
    roles: ['staff'],
  },
  {
    title: 'My Timesheets',
    icon: ClipboardList,
    path: '/staff/timesheets',
    roles: ['staff'],
  },
  {
    title: 'Participants',
    icon: PeopleIcon,
    roles: ['admin'],
    children: [
      { title: 'Participant Profiles', path: '/participants/profiles' },
      {
        title: 'Participant Detail',
        path: '/participants/detail',
        hidden: true,
        children: [{ title: 'Detail', path: '/participants/detail/:id' }],
      },
      { title: 'Shift Notes', path: '/participants/shift-notes' },
    ],
  },
  {
    title: 'Employees',
    icon: PeopleIcon,
    roles: ['admin'],
    children: [
      { title: 'Staff Profiles', path: '/employees/staff-profiles' },
      {
        title: 'Staff Detail',
        path: '/employees/staff-detail',
        hidden: true,
        children: [{ title: 'Detail', path: '/employees/staff-detail/:id' }],
      },
      { title: 'Timesheets', path: '/employees/timesheets' },
      { title: 'Leave Requests', path: '/employees/leave-requests' },
    ],
  },
  {
    title: 'Houses',
    icon: House,
    roles: ['admin'],
    children: [
      { title: 'House Profiles', path: '/houses/profiles' },
    ],
  },
  {
    title: 'Roster Board',
    icon: Calendar,
    path: '/roster-board',
    roles: ['admin'],
  },
];

export const MENU_SIDEBAR_CUSTOM: MenuConfig = [];
export const MENU_SIDEBAR_COMPACT: MenuConfig = [];
export const MENU_MEGA: MenuConfig = [];
export const MENU_MEGA_MOBILE: MenuConfig = [];
export const MENU_HELP: MenuConfig = [];
export const MENU_ROOT: MenuConfig = [];
