import { Fragment, useEffect, useRef, useState } from 'react';
import {
  Info,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { RBAC_MODULES, RBACModule } from '@/config/rbac-modules';
import { cn } from '@/lib/utils';
import {
  useAllRolePermissions,
  useUpdateRolePermissions,
} from '@/hooks/use-role-permissions';
import { useRoles } from '@/hooks/use-roles';
import { ACCESS_LEVEL, AccessLevel, useRBAC } from '@/hooks/useRBAC';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ModuleConfig {
  id?: RBACModule;
  label: string;
  isChild?: boolean;
  isLabelOnly?: boolean;
}

interface GroupConfig {
  title: string;
  modules: ModuleConfig[];
}

const GROUPS: GroupConfig[] = [
  {
    title: 'Staff Portal (Personal)',
    modules: [
      { id: RBAC_MODULES.MY_ROSTER, label: 'My Roster' },
      { id: RBAC_MODULES.MY_TIMESHEETS, label: 'My Timesheets' },
      { id: RBAC_MODULES.MY_LEAVE, label: 'My Leave' },
      { id: RBAC_MODULES.SHIFT_ROUTINES, label: 'Shift Routines' },
    ],
  },
  {
    title: 'Participant Records',
    modules: [
      { id: RBAC_MODULES.PARTICIPANTS, label: 'Participant Profiles' },
      { id: RBAC_MODULES.PARTICIPANT_GOALS, label: 'Goals', isChild: true },
      {
        id: RBAC_MODULES.PARTICIPANT_BEHAVIOUR,
        label: 'Behaviour & Support',
        isChild: true,
      },
      {
        id: RBAC_MODULES.PARTICIPANT_SUPPORT_NEEDS,
        label: 'Support Needs',
        isChild: true,
      },
      {
        id: RBAC_MODULES.PARTICIPANT_MEALTIME,
        label: 'Mealtime Management',
        isChild: true,
      },
      {
        id: RBAC_MODULES.PARTICIPANT_MEDICAL_ROUTINE,
        label: 'Medical Routine',
        isChild: true,
      },
      {
        id: RBAC_MODULES.PARTICIPANT_CLINICAL_TRACKERS,
        label: 'Clinical Trackers Setup',
        isChild: true,
      },
      {
        id: RBAC_MODULES.PARTICIPANT_MEDICATIONS,
        label: 'Medications',
        isChild: true,
      },
      {
        id: RBAC_MODULES.PARTICIPANT_EMERGENCY,
        label: 'Emergency Management',
        isChild: true,
      },
      {
        id: RBAC_MODULES.PARTICIPANT_CONTACTS,
        label: 'Contacts',
        isChild: true,
      },
      {
        id: RBAC_MODULES.PARTICIPANT_DOCUMENTS,
        label: 'Documents',
        isChild: true,
      },
      {
        id: RBAC_MODULES.PARTICIPANT_SHIFT_NOTES,
        label: 'Shift Notes',
        isChild: true,
      },
      {
        id: RBAC_MODULES.PARTICIPANT_ACTIVITY_LOG,
        label: 'Activity Log',
        isChild: true,
      },
    ],
  },
  {
    title: 'Employees',
    modules: [
      { id: RBAC_MODULES.EMPLOYEES, label: 'Staff Profiles' },
      {
        id: RBAC_MODULES.STAFF_EMPLOYMENT,
        label: 'Employment Details',
        isChild: true,
      },
      {
        id: RBAC_MODULES.STAFF_AVAILABILITY,
        label: 'Availability',
        isChild: true,
      },
      {
        id: RBAC_MODULES.STAFF_EMERGENCY,
        label: 'Emergency Contact',
        isChild: true,
      },
      { id: RBAC_MODULES.STAFF_COMPLIANCE, label: 'Compliance', isChild: true },
      { id: RBAC_MODULES.STAFF_ONBOARDING, label: 'Onboarding', isChild: true },
      { id: RBAC_MODULES.STAFF_TRAINING, label: 'Training', isChild: true },
      {
        id: RBAC_MODULES.STAFF_QUALIFICATIONS,
        label: 'Qualifications',
        isChild: true,
      },
      { id: RBAC_MODULES.STAFF_DOCUMENTS, label: 'Documents', isChild: true },
      {
        id: RBAC_MODULES.STAFF_ROSTER,
        label: 'Roster (Detail View)',
        isChild: true,
      },
      {
        id: RBAC_MODULES.STAFF_LEAVE,
        label: 'Leave (Detail View)',
        isChild: true,
      },
      { id: RBAC_MODULES.STAFF_WARNINGS, label: 'Warnings', isChild: true },
      {
        id: RBAC_MODULES.STAFF_ACTIVITY_LOG,
        label: 'Activity Log',
        isChild: true,
      },
    ],
  },
  {
    title: 'Roster & Staff Scheduling',
    modules: [
      { id: RBAC_MODULES.ROSTER_BOARD, label: 'Roster Board' },
      { id: RBAC_MODULES.SHIFT_TEMPLATES, label: 'Shift Setup' },
      { id: RBAC_MODULES.TIMESHEETS, label: 'Timesheet Approvals' },
      { id: RBAC_MODULES.LEAVE_REQUESTS, label: 'Leave Approvals' },
    ],
  },
  {
    title: 'Houses',
    modules: [
      { id: RBAC_MODULES.HOUSES, label: 'House Profiles' },
      {
        id: RBAC_MODULES.HOUSE_MANAGEMENT,
        label: 'House Management',
        isChild: true,
      },
      {
        id: RBAC_MODULES.HOUSE_OPERATIONS,
        label: 'Daily Operations',
        isChild: true,
      },
      {
        id: RBAC_MODULES.HOUSE_CHECKLISTS,
        label: 'Checklist Setup',
        isChild: true,
      },
      {
        id: RBAC_MODULES.HOUSE_CHECKLIST_HISTORY,
        label: 'Checklist History',
        isChild: true,
      },
      { id: RBAC_MODULES.HOUSE_RESOURCES, label: 'Resources', isChild: true },
      { id: RBAC_MODULES.HOUSE_STAFF, label: 'Staff', isChild: true },
      {
        id: RBAC_MODULES.HOUSE_ACTIVITY_LOG,
        label: 'Activity Log',
        isChild: true,
      },
    ],
  },
  {
    title: 'System Administration',
    modules: [
      { id: RBAC_MODULES.ACCESS_CONTROL, label: 'Access Control' },
      { id: RBAC_MODULES.MASTER_LISTS, label: 'Master Lists' },
      {
        id: RBAC_MODULES.ADMIN_COMPLIANCE,
        label: 'Compliance Administration',
      },
      {
        id: RBAC_MODULES.ADMIN_ONBOARDING,
        label: 'Onboarding Administration',
      },
      { id: RBAC_MODULES.INCIDENT_MANAGEMENT, label: 'Incident Management' },
      { id: RBAC_MODULES.ACTIVITY_LOG, label: 'System Activity Log' },
      { label: 'Reporting', isLabelOnly: true },
      {
        id: RBAC_MODULES.REPORTING_CLINICAL,
        label: 'Clinical Reports',
        isChild: true,
      },
      {
        id: RBAC_MODULES.REPORTING_OPERATIONAL,
        label: 'Operational Reports',
        isChild: true,
      },
      {
        id: RBAC_MODULES.REPORTING_COMPLIANCE,
        label: 'Compliance Reports',
        isChild: true,
      },
    ],
  },
];

/**
 * Dynamic description logic based on Module + Level
 */
export const getContextDescription = (
  moduleId: RBACModule,
  level: AccessLevel,
  moduleLabel?: string,
): { prefix: string; body: string } => {
  const label = moduleLabel || 'this module';

  if (level === ACCESS_LEVEL.NONE) {
    return {
      prefix: 'No Access',
      body: `to ${label}. Module is hidden and access is blocked.`,
    };
  }

  const isPersonal = (
    [
      RBAC_MODULES.MY_ROSTER,
      RBAC_MODULES.MY_TIMESHEETS,
      RBAC_MODULES.MY_LEAVE,
      RBAC_MODULES.SHIFT_ROUTINES,
    ] as RBACModule[]
  ).includes(moduleId);

  const isManagement = (
    [
      RBAC_MODULES.EMPLOYEES,
      RBAC_MODULES.STAFF_ONBOARDING,
      RBAC_MODULES.STAFF_COMPLIANCE,
      RBAC_MODULES.TIMESHEETS,
      RBAC_MODULES.LEAVE_REQUESTS,
      RBAC_MODULES.ROSTER_BOARD,
      RBAC_MODULES.INCIDENT_MANAGEMENT,
    ] as RBACModule[]
  ).includes(moduleId);

  const isOperational = (
    [
      RBAC_MODULES.HOUSES,
      RBAC_MODULES.HOUSE_MANAGEMENT,
      RBAC_MODULES.HOUSE_OPERATIONS,
      RBAC_MODULES.HOUSE_CHECKLISTS,
      RBAC_MODULES.HOUSE_CHECKLIST_HISTORY,
      RBAC_MODULES.HOUSE_RESOURCES,
      RBAC_MODULES.HOUSE_STAFF,
    ] as RBACModule[]
  ).includes(moduleId);

  const isClinical = (
    [
      RBAC_MODULES.PARTICIPANTS,
      RBAC_MODULES.PARTICIPANT_GOALS,
      RBAC_MODULES.PARTICIPANT_BEHAVIOUR,
      RBAC_MODULES.PARTICIPANT_SUPPORT_NEEDS,
      RBAC_MODULES.PARTICIPANT_MEALTIME,
      RBAC_MODULES.PARTICIPANT_MEDICAL_ROUTINE,
      RBAC_MODULES.PARTICIPANT_CLINICAL_TRACKERS,
      RBAC_MODULES.PARTICIPANT_MEDICATIONS,
      RBAC_MODULES.PARTICIPANT_EMERGENCY,
      RBAC_MODULES.PARTICIPANT_CONTACTS,
      RBAC_MODULES.PARTICIPANT_DOCUMENTS,
      RBAC_MODULES.PARTICIPANT_SHIFT_NOTES,
      RBAC_MODULES.PARTICIPANT_ACTIVITY_LOG,
    ] as RBACModule[]
  ).includes(moduleId);

  const isSystem = (
    [
      RBAC_MODULES.ACCESS_CONTROL,
      RBAC_MODULES.MASTER_LISTS,
      RBAC_MODULES.ADMIN_COMPLIANCE,
      RBAC_MODULES.ADMIN_ONBOARDING,
      RBAC_MODULES.ACTIVITY_LOG,
      RBAC_MODULES.HOUSE_ACTIVITY_LOG,
    ] as RBACModule[]
  ).includes(moduleId);

  const isReporting = (
    [
      RBAC_MODULES.REPORTING_CLINICAL,
      RBAC_MODULES.REPORTING_OPERATIONAL,
      RBAC_MODULES.REPORTING_COMPLIANCE,
    ] as RBACModule[]
  ).includes(moduleId);

  switch (level) {
    case ACCESS_LEVEL.FULL:
      return {
        prefix: 'Full Access',
        body: `to ${label} organization-wide.`,
      };
    case ACCESS_LEVEL.READ_ONLY:
      return {
        prefix: 'Read-only',
        body: `of ${label} organization-wide. No edits allowed.`,
      };
    case ACCESS_LEVEL.CONTEXT_READ_WRITE:
      if (isPersonal)
        return {
          prefix: 'Read/Write',
          body: `access limited to your own personal ${label} records.`,
        };
      if (isManagement)
        return {
          prefix: 'Read/Write',
          body: `of ${label} for direct reports or assigned house staff.`,
        };
      if (isClinical)
        return {
          prefix: 'Read/Write',
          body: `of ${label} for participants in your assigned houses.`,
        };
      if (isOperational)
        return {
          prefix: 'Read/Write',
          body: `management of ${label} within your assigned houses.`,
        };
      if (isSystem)
        return {
          prefix: 'Full Access',
          body: `to ${label} configurations and logs.`,
        };
      if (isReporting)
        return {
          prefix: 'Read/Write',
          body: `of ${label} reports for assigned houses and staff.`,
        };
      return {
        prefix: 'Read/Write',
        body: `context-aware access to ${label}.`,
      };
    case ACCESS_LEVEL.CONTEXT_READ_ONLY:
      if (isPersonal)
        return {
          prefix: 'View-only',
          body: `of your own personal ${label} records.`,
        };
      if (isManagement)
        return {
          prefix: 'View-only',
          body: `of ${label} for direct reports or assigned house staff.`,
        };
      if (isClinical)
        return {
          prefix: 'View-only',
          body: `of ${label} for participants in your assigned houses.`,
        };
      if (isOperational)
        return {
          prefix: 'View-only',
          body: `of ${label} within your assigned houses.`,
        };
      if (isSystem)
        return {
          prefix: 'View-only',
          body: `of ${label} logs and configurations.`,
        };
      if (isReporting)
        return {
          prefix: 'View-only',
          body: `of ${label} reports for assigned houses and staff.`,
        };
      return {
        prefix: 'View-only',
        body: `context-aware access to ${label}.`,
      };
    default:
      return { prefix: 'Restricted', body: `access to ${label}.` };
  }
};

const ACCESS_LEVELS: {
  value: AccessLevel;
  label: string;
  description: string;
}[] = [
  {
    value: ACCESS_LEVEL.FULL,
    label: 'Full Access',
    description: 'Global access to all records',
  },
  {
    value: ACCESS_LEVEL.CONTEXT_READ_WRITE,
    label: 'Context Read/Write',
    description: 'Locked to house/reports',
  },
  {
    value: ACCESS_LEVEL.CONTEXT_READ_ONLY,
    label: 'Context Read-Only',
    description: 'View locked to house/reports',
  },
  {
    value: ACCESS_LEVEL.READ_ONLY,
    label: 'Read-Only',
    description: 'Global View, No Edits',
  },
  {
    value: ACCESS_LEVEL.NONE,
    label: 'No Access',
    description: 'Hidden & Blocked',
  },
];

export function RolePermissionsMatrix() {
  const { roles = [] } = useRoles();
  const { data: allPermissions = [], isLoading } = useAllRolePermissions();
  const { mutateAsync: updatePermissions } = useUpdateRolePermissions();
  const { hasAccess } = useRBAC();

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const handleHeaderScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (
      bodyScrollRef.current &&
      bodyScrollRef.current.scrollLeft !== e.currentTarget.scrollLeft
    ) {
      bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (
      headerScrollRef.current &&
      headerScrollRef.current.scrollLeft !== e.currentTarget.scrollLeft
    ) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const canEdit = hasAccess({
    resource: RBAC_MODULES.ACCESS_CONTROL,
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE,
  });

  const activeRoles = roles.filter((r) => r.is_active);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [matrixSearch, setMatrixSearch] = useState('');

  const selectedRole = activeRoles.find((r) => r.id === selectedRoleId);
  const selectedPermissions = allPermissions.find(
    (p) => p.role_id === selectedRoleId,
  );

  // Determine if this is an Admin role based on access_control permissions
  const isAdminRole = selectedPermissions?.access_control === ACCESS_LEVEL.FULL;

  // Auto-select the first role when loaded
  useEffect(() => {
    if (!selectedRoleId && activeRoles.length > 0) {
      setSelectedRoleId(activeRoles[0].id);
    }
  }, [activeRoles, selectedRoleId]);

  const getPermission = (moduleId: string): AccessLevel => {
    if (!selectedRoleId) return ACCESS_LEVEL.NONE;
    const rolePerms = allPermissions.find((p) => p.role_id === selectedRoleId);
    if (!rolePerms) return ACCESS_LEVEL.NONE;
    return (rolePerms as any)[moduleId] || ACCESS_LEVEL.NONE;
  };

  const handleUpdate = async (moduleId: string, level: AccessLevel) => {
    if (!selectedRoleId || isAdminRole || !canEdit) return;
    try {
      await updatePermissions({
        role_id: selectedRoleId,
        updates: { [moduleId]: level } as any,
      });
      const levelLabel =
        ACCESS_LEVELS.find((l) => l.value === level)?.label || level;
      toast.success(`Access level set to ${levelLabel}`);
    } catch (error) {
      toast.error('Failed to save permissions');
    }
  };

  const handleBatchSectionUpdate = async (
    modules: ModuleConfig[],
    level: AccessLevel,
  ) => {
    if (!selectedRoleId || isAdminRole || !canEdit) return;

    const updates: Record<string, AccessLevel> = {};
    modules.forEach((mod) => {
      if (mod.id && !mod.isLabelOnly) {
        updates[mod.id] = level;
      }
    });

    if (Object.keys(updates).length === 0) return;

    try {
      await updatePermissions({
        role_id: selectedRoleId,
        updates: updates as any,
      });
      const levelLabel =
        ACCESS_LEVELS.find((l) => l.value === level)?.label || level;
      toast.success(`Set section access level to ${levelLabel}`);
    } catch (error) {
      toast.error('Failed to save section permissions');
    }
  };

  const filteredGroups = GROUPS.map((group) => {
    const matchedModules = group.modules.filter((m) =>
      m.label.toLowerCase().includes(matrixSearch.toLowerCase()),
    );
    return { ...group, modules: matchedModules };
  }).filter((group) => group.modules.length > 0);

  if (isLoading || !selectedRoleId) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-gray-500">
          Loading permissions matrix...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isAdminRole && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200">
          <ShieldAlert className="size-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-bold">
            Admin Privileges Locked
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            The {selectedRole?.role_name} role has system-wide override access.
            These permissions are locked and cannot be reduced. Certain personal
            modules (like Rosters and Timesheets) may not apply to full-time
            administrators.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-5 border-b mb-0">
          <div className="flex flex-col gap-2 w-full sm:max-w-[350px]">
            <Label className="text-sm font-bold text-gray-700">
              Select Role to Edit
            </Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="h-10 border-primary focus:ring-primary">
                <SelectValue placeholder="-- Select a role to configure --" />
              </SelectTrigger>
              <SelectContent>
                {activeRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.role_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full sm:max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search modules..."
              value={matrixSearch}
              onChange={(e) => setMatrixSearch(e.target.value)}
              className="pl-9 h-10 border-gray-200 focus:border-primary"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <style>{`
            .scrollbar-none::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-none {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          
          {/* Header Table (Sticky to Viewport) */}
          <div
            ref={headerScrollRef}
            onScroll={handleHeaderScroll}
            className="overflow-x-auto overflow-y-hidden border-b sticky top-[var(--header-height,70px)] z-[5] bg-gray-100 scrollbar-none"
          >
            <table className="w-[980px] border-separate border-spacing-0 table-layout-fixed caption-bottom text-foreground text-sm bg-gray-100">
              <colgroup>
                <col className="w-[280px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
              </colgroup>
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="sticky left-0 z-[6] bg-gray-100 text-start font-bold text-gray-900 w-[280px] min-w-[280px] max-w-[280px] py-3.5 px-4 border-b border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Module
                  </th>
                  {ACCESS_LEVELS.map((level) => (
                    <th
                      key={level.value}
                      className="min-w-[140px] w-[140px] max-w-[140px] text-center py-3.5 px-4 border-b border-gray-200 bg-gray-100"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-gray-900 text-xs">
                          {level.label}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium leading-none">
                          {level.description}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>

          {/* Body Table */}
          <div
            ref={bodyScrollRef}
            onScroll={handleBodyScroll}
            className="overflow-x-auto overflow-y-visible border-b relative"
          >
            <table className="w-[980px] border-separate border-spacing-0 table-layout-fixed caption-bottom text-foreground text-sm">
              <colgroup>
                <col className="w-[280px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
              </colgroup>
              <TableBody className="text-sm font-medium">
                {filteredGroups.map((group) => {
                  // Special logic for Houses group dependency
                  const isHousesGroup = group.title === 'Houses';
                  const houseProfilesLevel = getPermission(RBAC_MODULES.HOUSES);
                  const houseProfilesDisabled =
                    houseProfilesLevel === ACCESS_LEVEL.NONE;

                  // Special logic for Participant Records group dependency
                  const isParticipantsGroup =
                    group.title === 'Participant Records';
                  const participantProfilesLevel = getPermission(
                    RBAC_MODULES.PARTICIPANTS,
                  );
                  const participantProfilesDisabled =
                    participantProfilesLevel === ACCESS_LEVEL.NONE;

                  // Special logic for Employees group dependency
                  const isEmployeesGroup = group.title === 'Employees';
                  const staffProfilesLevel = getPermission(
                    RBAC_MODULES.EMPLOYEES,
                  );
                  const staffProfilesDisabled =
                    staffProfilesLevel === ACCESS_LEVEL.NONE;

                  return (
                    <Fragment key={group.title}>
                      <TableRow
                        key={`${group.title}-header`}
                        className="bg-gray-100/95 backdrop-blur-sm"
                      >
                        <TableCell className="sticky left-0 z-[2] bg-gray-100/95 backdrop-blur-sm py-2.5 pl-8 border-b border-r font-bold text-gray-900 text-xs uppercase tracking-wider">
                          {group.title}
                        </TableCell>
                        {ACCESS_LEVELS.map((level) => {
                          const validModules = group.modules.filter(
                            (m) => m.id && !m.isLabelOnly,
                          );
                          const isAllLevel =
                            validModules.length > 0 &&
                            validModules.every((m) => {
                              const current = getPermission(m.id!);
                              return isAdminRole
                                ? level.value === ACCESS_LEVEL.FULL
                                : current === level.value;
                            });

                          return (
                            <TableCell
                              key={level.value}
                              className="py-2.5 text-center border-b bg-gray-100/95 backdrop-blur-sm"
                            >
                              {canEdit ? (
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={isAllLevel}
                                    onCheckedChange={(checked) => {
                                      const targetLevel = checked
                                        ? level.value
                                        : ACCESS_LEVEL.NONE;
                                      handleBatchSectionUpdate(
                                        group.modules,
                                        targetLevel,
                                      );
                                    }}
                                    disabled={isAdminRole || !canEdit}
                                    className="size-5 border-gray-400 bg-white data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all cursor-pointer shadow-2xs"
                                    title={`Click to set all modules in ${group.title} to ${level.label}`}
                                  />
                                </div>
                              ) : null}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {group.modules.map((module) => {
                        const currentLevel = module.id
                          ? getPermission(module.id)
                          : ACCESS_LEVEL.NONE;

                        // Dependency checks
                        const isLocked =
                          module.id &&
                          ((isHousesGroup &&
                            houseProfilesDisabled &&
                            module.id !== RBAC_MODULES.HOUSES) ||
                            (isParticipantsGroup &&
                              participantProfilesDisabled &&
                              module.id !== RBAC_MODULES.PARTICIPANTS) ||
                            (isEmployeesGroup &&
                              staffProfilesDisabled &&
                              module.id !== RBAC_MODULES.EMPLOYEES &&
                              module.isChild));

                        const desc = module.id
                          ? getContextDescription(
                              module.id,
                              isAdminRole ? ACCESS_LEVEL.FULL : currentLevel,
                              module.label,
                            )
                          : null;

                        return (
                          <TableRow
                            key={`${group.title}-${module.id || module.label}`}
                            className={cn(
                              'group hover:bg-gray-50/50 transition-colors',
                              isLocked && 'opacity-60 grayscale-[0.5]',
                              module.isLabelOnly &&
                                'bg-gray-100/95 hover:bg-gray-100/95 backdrop-blur-sm cursor-default',
                            )}
                          >
                            <TableCell
                              className={cn(
                                'py-4 sticky left-0 z-[2] bg-white group-hover:bg-[#fcfcfe] transition-colors border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]',
                                module.isChild ? 'pl-14' : 'pl-8',
                                module.isLabelOnly &&
                                  'bg-gray-100/95 py-2.5 pl-8 border-b font-bold text-gray-900 text-xs uppercase tracking-wider',
                              )}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-wrap">
                                  <span
                                    className={cn(
                                      'font-semibold',
                                      module.isChild
                                        ? 'text-gray-600'
                                        : 'text-gray-700',
                                      module.isLabelOnly &&
                                        'text-gray-900 font-bold',
                                    )}
                                  >
                                    {module.label}
                                  </span>
                                  {isLocked && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] py-0 px-1.5 h-4 font-bold uppercase tracking-tight bg-gray-100 text-gray-400 border-none whitespace-nowrap"
                                    >
                                      LOCKED
                                    </Badge>
                                  )}
                                </div>
                                {!module.isLabelOnly && desc && (
                                  <div className="flex items-start gap-1 text-[11px] text-gray-400 mt-1 leading-relaxed">
                                    <Info className="size-3 mt-0.5 shrink-0" />
                                    <span>
                                      {isLocked ? (
                                        <span className="italic text-gray-400">
                                          Requires '
                                          {isHousesGroup
                                            ? 'Houses'
                                            : isParticipantsGroup
                                              ? 'Participant Profiles'
                                              : 'Staff Profiles'}
                                          ' access to be active.
                                        </span>
                                      ) : (
                                        <>
                                          <span className="font-bold text-gray-600">
                                            {desc.prefix}
                                          </span>{' '}
                                          {desc.body}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            {ACCESS_LEVELS.map((level) => {
                              let isChecked = false;
                              let isDisabled = isAdminRole || !canEdit;

                              if (!module.isLabelOnly) {
                                isChecked = currentLevel === level.value;
                                if (isAdminRole) {
                                  isChecked = level.value === ACCESS_LEVEL.FULL;
                                }
                                isDisabled = isDisabled || isLocked;
                              } else if (module.label === 'Reporting') {
                                const reportingModuleIds = [
                                  RBAC_MODULES.REPORTING_CLINICAL,
                                  RBAC_MODULES.REPORTING_OPERATIONAL,
                                  RBAC_MODULES.REPORTING_COMPLIANCE,
                                ];
                                isChecked = reportingModuleIds.every((modId) => {
                                  const current = getPermission(modId);
                                  return isAdminRole
                                    ? level.value === ACCESS_LEVEL.FULL
                                    : current === level.value;
                                });
                              }

                              return (
                                <TableCell
                                  key={level.value}
                                  className={cn(
                                    'py-4 text-center border-b border-gray-100 last:border-r-0',
                                    module.isLabelOnly && 'py-2.5 bg-gray-100/95 backdrop-blur-sm',
                                  )}
                                >
                                  {(!module.isLabelOnly || module.label === 'Reporting') && (
                                    <div className="flex justify-center">
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          if (isDisabled) return;
                                          if (!module.isLabelOnly) {
                                            if (!isChecked && module.id) {
                                              handleUpdate(module.id, level.value);
                                            }
                                          } else if (module.label === 'Reporting') {
                                            const targetLevel = checked
                                              ? level.value
                                              : ACCESS_LEVEL.NONE;
                                            const reportingModules = [
                                              { id: RBAC_MODULES.REPORTING_CLINICAL, label: 'Clinical Reports' },
                                              { id: RBAC_MODULES.REPORTING_OPERATIONAL, label: 'Operational Reports' },
                                              { id: RBAC_MODULES.REPORTING_COMPLIANCE, label: 'Compliance Reports' },
                                            ];
                                            handleBatchSectionUpdate(reportingModules, targetLevel);
                                          }
                                        }}
                                        disabled={isDisabled}
                                        className={cn(
                                          module.isLabelOnly
                                            ? 'size-5 border-gray-400 bg-white data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all cursor-pointer shadow-2xs'
                                            : 'size-5 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all',
                                          isDisabled && 'opacity-50 cursor-not-allowed',
                                        )}
                                        title={
                                          module.isLabelOnly
                                            ? `Click to set all modules in ${module.label} to ${level.label}`
                                            : undefined
                                        }
                                      />
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </TableBody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50/50 py-5 border-t text-sm text-gray-500 italic">
          Changes are saved automatically to the database when a checkbox is
          clicked.
        </CardFooter>
      </Card>
    </div>
  );
}
