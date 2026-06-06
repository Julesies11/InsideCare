import {
  ScrollspyMenu,
  ScrollspyMenuItems,
} from '@/partials/navbar/scrollspy-menu';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';

export function HouseDetailSidebar() {
  const { hasAccess } = useRBAC();

  const menuItems: ScrollspyMenuItems = [
    {
      title: 'House Details',
      target: 'house_details',
      active: true,
      hidden: !hasAccess({ resource: RBAC_MODULES.HOUSES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'House Management',
      target: 'house_management',
      hidden: !hasAccess({ resource: RBAC_MODULES.HOUSE_MANAGEMENT, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
      children: [
        {
          title: 'Participants',
          target: 'house_participants',
        },
        {
          title: 'General House Details',
          target: 'house_general_details',
        },
        {
          title: 'Breakdown of Individuals',
          target: 'house_individuals_breakdown',
        },
        {
          title: 'Dynamics within Participants',
          target: 'house_participant_dynamics',
        },
        {
          title: 'Risk Management',
          target: 'house_risk_management',
        },
        {
          title: 'Observations',
          target: 'house_observations',
        },
      ]
    },
    {
      title: 'Daily Operations',
      target: 'daily_operations',
      hidden: !hasAccess({ resource: RBAC_MODULES.HOUSE_OPERATIONS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
      children: [
        {
          title: 'Calendar',
          target: 'calendar_events',
        },
        {
          title: 'Daily Comms',
          target: 'house_comms',
        },
      ]
    },
    {
      title: 'Checklist Setup',
      target: 'checklists',
      hidden: !hasAccess({ resource: RBAC_MODULES.HOUSE_CHECKLISTS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Checklist History',
      target: 'checklist_history',
      hidden: !hasAccess({ resource: RBAC_MODULES.HOUSE_CHECKLIST_HISTORY, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Resources',
      target: 'resources',
      hidden: !hasAccess({ resource: RBAC_MODULES.HOUSE_RESOURCES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Staff',
      target: 'staff',
      hidden: !hasAccess({ resource: RBAC_MODULES.HOUSE_STAFF, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Compliance Requirements',
      target: 'compliance_settings',
      hidden: !hasAccess({ resource: RBAC_MODULES.HOUSES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Activity Log',
      target: 'activity_log',
      hidden: !hasAccess({ resource: RBAC_MODULES.HOUSE_ACTIVITY_LOG, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
  ];

  // Filter out hidden items
  const items = menuItems.filter(item => !item.hidden);

  return <ScrollspyMenu items={items} />;
}
