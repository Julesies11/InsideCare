import {
  ScrollspyMenu,
  ScrollspyMenuItems,
} from '@/partials/navbar/scrollspy-menu';
import { RBAC_MODULES } from '@/config/rbac-modules';
import { ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';

export function ParticipantDetailSidebar() {
  const { hasAccess } = useRBAC();

  const items: ScrollspyMenuItems = [
    {
      title: 'Personal Details',
      target: 'personal_details',
      active: true,
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANTS,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Goals',
      target: 'goals',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_GOALS,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Behaviour & Support',
      target: 'behaviour',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_BEHAVIOUR,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Support Needs',
      target: 'support-needs',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_SUPPORT_NEEDS,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
      children: [
        {
          title: 'Personal Care and Routine',
          target: 'support-needs-personal-care',
        },
        {
          title: 'Mobility',
          target: 'support-needs-mobility',
        },
        {
          title: 'Meal Preparation',
          target: 'support-needs-meal-prep',
        },
        {
          title: 'Household Tasks',
          target: 'support-needs-household',
        },
        {
          title: 'Communication',
          target: 'support-needs-communication',
        },
        {
          title: 'Finances',
          target: 'support-needs-finances',
        },
        {
          title: 'Health and Wellbeing',
          target: 'support-needs-health',
        },
        {
          title: 'Cultural and Religious',
          target: 'support-needs-cultural',
        },
        {
          title: 'Other',
          target: 'support-needs-other',
        },
      ],
    },
    {
      title: 'Mealtime Management',
      target: 'mealtime',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_MEALTIME,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Clinical Details',
      target: 'clinical',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_MEDICAL_ROUTINE,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Clinical Trackers',
      target: 'clinical-trackers',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_CLINICAL_TRACKERS,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Medical Routine',
      target: 'medical-routine',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_MEDICAL_ROUTINE,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
      children: [
        {
          title: 'Pharmacy',
          target: 'medical-routine-pharmacy',
        },
        {
          title: 'General Practitioner',
          target: 'medical-routine-gp',
        },
        {
          title: 'Psychiatrist',
          target: 'medical-routine-psychiatrist',
        },
      ],
    },
    {
      title: 'Medications',
      target: 'medications',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_MEDICATIONS,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Emergency Management',
      target: 'emergency-management',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_EMERGENCY,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Contacts',
      target: 'contacts',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_CONTACTS,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Documents',
      target: 'documents',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_DOCUMENTS,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Shift Notes',
      target: 'shift_notes',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_SHIFT_NOTES,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
    {
      title: 'Activity Log',
      target: 'activity_log',
      hidden: !hasAccess({
        resource: RBAC_MODULES.PARTICIPANT_ACTIVITY_LOG,
        requiredLevel: ACCESS_LEVEL.CONTEXT_READ_ONLY,
      }),
    },
  ];

  // Filter out hidden items
  const filteredItems = items.filter((item) => !item.hidden);

  return <ScrollspyMenu items={filteredItems} />;
}
