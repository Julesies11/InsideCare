import { useState, useEffect, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRoles } from '@/hooks/use-roles';
import { useAllRolePermissions, useUpdateRolePermissions } from '@/hooks/use-role-permissions';
import { toast } from 'sonner';
import { Info, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RBAC_MODULES, RBACModule } from '@/config/rbac-modules';
import { AccessLevel, ACCESS_LEVEL, useRBAC } from '@/hooks/useRBAC';

interface ModuleConfig {
  id: RBACModule;
  label: string;
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
      { id: RBAC_MODULES.PARTICIPANTS, label: 'Participants' },
      { id: RBAC_MODULES.SHIFT_NOTES, label: 'Shift Notes' },
    ],
  },
  {
    title: 'Employees & HR',
    modules: [
      { id: RBAC_MODULES.EMPLOYEES, label: 'Employees' },
      { id: RBAC_MODULES.TIMESHEETS, label: 'Timesheets' },
      { id: RBAC_MODULES.LEAVE_REQUESTS, label: 'Leave Requests' },
      { id: RBAC_MODULES.ROSTER_BOARD, label: 'Roster Board' },
    ],
  },
  {
    title: 'Operations & Facilities',
    modules: [
      { id: RBAC_MODULES.HOUSES, label: 'Houses' },
      { id: RBAC_MODULES.HOUSE_CHECKLISTS, label: 'House Checklists' },
    ],
  },
  {
    title: 'System Administration',
    modules: [
      { id: RBAC_MODULES.ACCESS_CONTROL, label: 'Access Control' },
      { id: RBAC_MODULES.MASTER_LISTS, label: 'Master Lists' },
      { id: RBAC_MODULES.ACTIVITY_LOG, label: 'Activity Log' },
    ],
  },
];

/**
 * Dynamic description logic based on Module + Level
 */
export const getContextDescription = (moduleId: RBACModule, level: AccessLevel): string => {
  if (level === ACCESS_LEVEL.NONE) return 'Module is hidden and access is blocked.';
  
  const isPersonal = [
    RBAC_MODULES.MY_ROSTER, 
    RBAC_MODULES.MY_TIMESHEETS, 
    RBAC_MODULES.MY_LEAVE, 
    RBAC_MODULES.SHIFT_ROUTINES
  ].includes(moduleId);

  const isManagement = [
    RBAC_MODULES.EMPLOYEES, 
    RBAC_MODULES.TIMESHEETS, 
    RBAC_MODULES.LEAVE_REQUESTS, 
    RBAC_MODULES.ROSTER_BOARD
  ].includes(moduleId);

  const isOperational = [
    RBAC_MODULES.HOUSES, 
    RBAC_MODULES.HOUSE_CHECKLISTS
  ].includes(moduleId);

  const isClinical = [
    RBAC_MODULES.PARTICIPANTS, 
    RBAC_MODULES.SHIFT_NOTES
  ].includes(moduleId);

  switch (level) {
    case ACCESS_LEVEL.FULL:
      return 'Global access to all records across the organization.';
    case ACCESS_LEVEL.READ_ONLY:
      return 'Global view-only access to all records (No edits).';
    case ACCESS_LEVEL.CONTEXT_READ_WRITE:
      if (isPersonal) return 'Access limited to your own personal records.';
      if (isManagement) return 'View and edit direct reports or assigned house staff.';
      if (isClinical) return 'View and edit participants in your assigned houses.';
      if (isOperational) return 'Full management of assigned houses and facilities.';
      return 'Context-aware read and write access.';
    case ACCESS_LEVEL.CONTEXT_READ_ONLY:
      if (isPersonal) return 'View-only access to your own personal records.';
      if (isManagement) return 'View-only access for direct reports or assigned houses.';
      if (isClinical) return 'View-only for participants in your assigned houses.';
      if (isOperational) return 'View-only access for assigned houses and facilities.';
      return 'Context-aware view-only access.';
    default:
      return 'Access is restricted.';
  }
};

const ACCESS_LEVELS: { value: AccessLevel; label: string; description: string }[] = [
  { value: ACCESS_LEVEL.FULL, label: 'Full Access', description: 'Global access to all records' },
  { value: ACCESS_LEVEL.CONTEXT_READ_WRITE, label: 'Context Read/Write', description: 'Locked to house/reports' },
  { value: ACCESS_LEVEL.CONTEXT_READ_ONLY, label: 'Context Read-Only', description: 'View locked to house/reports' },
  { value: ACCESS_LEVEL.READ_ONLY, label: 'Read-Only', description: 'Global View, No Edits' },
  { value: ACCESS_LEVEL.NONE, label: 'No Access', description: 'Hidden & Blocked' },
];

export function RolePermissionsMatrix() {
  const { roles = [] } = useRoles();
  const { data: allPermissions = [], isLoading } = useAllRolePermissions();
  const { mutateAsync: updatePermissions } = useUpdateRolePermissions();
  const { hasAccess } = useRBAC();

  const canEdit = hasAccess({ 
    resource: RBAC_MODULES.ACCESS_CONTROL, 
    requiredLevel: ACCESS_LEVEL.CONTEXT_READ_WRITE 
  });

  const activeRoles = roles.filter(r => r.is_active);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const selectedRole = activeRoles.find(r => r.id === selectedRoleId);
  const selectedPermissions = allPermissions.find(p => p.role_id === selectedRoleId);
  
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
    const rolePerms = allPermissions.find(p => p.role_id === selectedRoleId);
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
      const levelLabel = ACCESS_LEVELS.find(l => l.value === level)?.label || level;
      toast.success(`Access level set to ${levelLabel}`);
    } catch (error) {
      toast.error('Failed to save permissions');
    }
  };

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
          <AlertTitle className="text-amber-800 font-bold">Admin Privileges Locked</AlertTitle>
          <AlertDescription className="text-amber-700">
            The {selectedRole?.name} role has system-wide override access. These permissions are locked and cannot be reduced. 
            Certain personal modules (like Rosters and Timesheets) may not apply to full-time administrators.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 py-5 border-b mb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-semibold">
            Role Permissions
          </CardTitle>
          <p className="text-sm text-gray-500">
            Select the access level for each module for the selected role.
          </p>
        </div>
        <div className="w-[250px]">
          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {activeRoles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="text-start font-bold text-gray-900 min-w-[250px] py-4">
                Module
              </TableHead>
              {ACCESS_LEVELS.map(level => (
                <TableHead key={level.value} className="min-w-[140px] text-center py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-gray-900">{level.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium leading-none">
                      {level.description}
                    </span>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="text-sm font-medium">
            {GROUPS.map((group) => (
              <Fragment key={group.title}>
                <TableRow className="bg-gray-100/30">
                  <TableCell colSpan={ACCESS_LEVELS.length + 1} className="py-2.5 px-4 font-bold text-gray-800 uppercase tracking-wide text-xs">
                    {group.title}
                  </TableCell>
                </TableRow>
                {group.modules.map((module) => {
                  const currentLevel = getPermission(module.id);
                  return (
                    <TableRow key={module.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="py-4 pl-8">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700">{module.label}</span>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                            <Info className="size-3" />
                            <span>
                              {getContextDescription(
                                module.id, 
                                isAdminRole ? ACCESS_LEVEL.FULL : currentLevel
                              )}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      {ACCESS_LEVELS.map(level => {
                        let isChecked = currentLevel === level.value;
                        
                        // Override for Admin Role
                        if (isAdminRole) {
                          isChecked = level.value === ACCESS_LEVEL.FULL;
                        }

                        return (
                          <TableCell key={level.value} className="py-4 text-center">
                            <div className="flex justify-center">
                              <Checkbox 
                                checked={isChecked} 
                                onCheckedChange={() => {
                                  if (!isChecked && canEdit) handleUpdate(module.id, level.value);
                                }}
                                disabled={isAdminRole || !canEdit}
                                className={cn(
                                  "size-5 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                                  (isAdminRole || !canEdit) && "opacity-50 cursor-not-allowed"
                                )}
                              />
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="bg-gray-50/50 py-5 border-t text-sm text-gray-500 italic">
        Changes are saved automatically to the database when a checkbox is clicked.
      </CardFooter>
    </Card>
    </div>
  );
}
