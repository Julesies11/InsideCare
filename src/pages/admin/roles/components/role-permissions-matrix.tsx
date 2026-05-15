import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRoles } from '@/hooks/use-roles';
import { useAllRolePermissions, useUpdateRolePermissions, AccessLevel } from '@/hooks/use-role-permissions';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

const MODULES = [
  { id: 'participant_profiles', label: 'Participant Profiles', contextHelp: 'Locks to Assigned Houses' },
  { id: 'staff_profiles', label: 'Staff Profiles', contextHelp: 'Locks to Assigned Houses & Direct Reports' },
  { id: 'house_profiles', label: 'House Profiles', contextHelp: 'Locks to Assigned Houses' },
  { id: 'shift_notes', label: 'Shift Notes', contextHelp: 'Locks to Assigned Houses & Direct Reports' },
  { id: 'participant_documents', label: 'Participant Documents', contextHelp: 'Locks to Assigned Houses' },
  { id: 'house_documents', label: 'House Documents', contextHelp: 'Locks to Assigned Houses' },
  { id: 'staff_documents', label: 'Staff Documents', contextHelp: 'Locks to Assigned Houses & Direct Reports' },
  { id: 'roster_board', label: 'Roster Board', contextHelp: 'Locks to Assigned Houses & Direct Reports' },
  { id: 'assign_staff_to_shift', label: 'Assign Staff to Shift', contextHelp: 'Locks to Assigned Houses' },
  { id: 'shift_routines', label: 'Shift Routines', contextHelp: 'Locks to Assigned Houses' },
  { id: 'house_checklists', label: 'House Checklists', contextHelp: 'Locks to Assigned Houses' },
  { id: 'leave_requests', label: 'Leave Requests', contextHelp: 'Locks to Direct Reports (Managerial)' },
  { id: 'timesheets_submit', label: 'Timesheets – Submit', contextHelp: 'Locks to Self' },
  { id: 'timesheets_approve', label: 'Timesheets – Approve', contextHelp: 'Locks to Direct Reports (Managerial)' },
] as const;

const ACCESS_LEVELS: { value: AccessLevel; label: string; description: string }[] = [
  { value: 'full', label: 'Full Access', description: 'Global access to all records' },
  { value: 'context_read_write', label: 'Context Read/Write', description: 'Locked to house/reports' },
  { value: 'context_read_only', label: 'Context Read-Only', description: 'View locked to house/reports' },
  { value: 'read_only', label: 'Read-Only', description: 'Global View, No Edits' },
  { value: 'none', label: 'No Access', description: 'Hidden & Blocked' },
];

export function RolePermissionsMatrix() {
  const { roles = [] } = useRoles();
  const { data: allPermissions = [], isLoading } = useAllRolePermissions();
  const { mutateAsync: updatePermissions } = useUpdateRolePermissions();

  const activeRoles = roles.filter(r => r.is_active);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // Auto-select the first role when loaded
  useEffect(() => {
    if (!selectedRoleId && activeRoles.length > 0) {
      setSelectedRoleId(activeRoles[0].id);
    }
  }, [activeRoles, selectedRoleId]);

  const getPermission = (moduleId: string): AccessLevel => {
    if (!selectedRoleId) return 'none';
    const rolePerms = allPermissions.find(p => p.role_id === selectedRoleId);
    if (!rolePerms) return 'none';
    return (rolePerms as any)[moduleId] || 'none';
  };

  const handleUpdate = async (moduleId: string, level: AccessLevel) => {
    if (!selectedRoleId) return;
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
            {MODULES.map((module) => {
              const currentLevel = getPermission(module.id);
              return (
                <TableRow key={module.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">{module.label}</span>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                        <Info className="size-3" />
                        <span>Context: {module.contextHelp}</span>
                      </div>
                    </div>
                  </TableCell>
                  {ACCESS_LEVELS.map(level => {
                    const isChecked = currentLevel === level.value;
                    return (
                      <TableCell key={level.value} className="py-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox 
                            checked={isChecked} 
                            onCheckedChange={() => {
                              if (!isChecked) handleUpdate(module.id, level.value);
                            }}
                            className="size-5 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="bg-gray-50/50 py-5 border-t text-sm text-gray-500 italic">
        Changes are saved automatically to the database when a checkbox is clicked.
      </CardFooter>
    </Card>
  );
}
