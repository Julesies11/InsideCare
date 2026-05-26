import {
  ScrollspyMenu,
  ScrollspyMenuItems,
} from '@/partials/navbar/scrollspy-menu';
import { useRBAC, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';

export function StaffDetailSidebar() {
  const { hasAccess } = useRBAC();

  const items: ScrollspyMenuItems = [
    {
      title: 'Personal Details',
      target: 'personal_details',
      active: true,
      hidden: !hasAccess({ resource: RBAC_MODULES.EMPLOYEES, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Employment Details',
      target: 'employment_details',
      hidden: !hasAccess({ resource: RBAC_MODULES.STAFF_EMPLOYMENT, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Availability',
      target: 'staff_availability',
      hidden: !hasAccess({ resource: RBAC_MODULES.STAFF_AVAILABILITY, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Emergency Contact',
      target: 'emergency_contact',
      hidden: !hasAccess({ resource: RBAC_MODULES.STAFF_EMERGENCY, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Compliance',
      target: 'staff_compliance',
      hidden: !hasAccess({ resource: RBAC_MODULES.STAFF_COMPLIANCE, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Training',
      target: 'staff_training',
      hidden: !hasAccess({ resource: RBAC_MODULES.STAFF_TRAINING, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Documents',
      target: 'staff_documents',
      hidden: !hasAccess({ resource: RBAC_MODULES.STAFF_DOCUMENTS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Roster',
      target: 'staff_roster',
      hidden: !hasAccess({ resource: RBAC_MODULES.STAFF_ROSTER, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Leave',
      target: 'staff_leave',
      hidden: !hasAccess({ resource: RBAC_MODULES.STAFF_LEAVE, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Warnings',
      target: 'staff_warnings',
      hidden: !hasAccess({ resource: RBAC_MODULES.STAFF_WARNINGS, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
    {
      title: 'Activity Log',
      target: 'staff_activity_log',
      hidden: !hasAccess({ resource: RBAC_MODULES.STAFF_ACTIVITY_LOG, requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY }),
    },
  ];

  // Filter out hidden items
  const filteredItems = items.filter(item => !item.hidden);

  return <ScrollspyMenu items={filteredItems} />;
}
