import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown, Users, ShieldCheck, List } from 'lucide-react';
import { useRoles, useAddRole, useUpdateRole, Role } from '@/hooks/use-roles';
import { RoleMasterQuickAdd } from '@/pages/employees/staff-detail/components/employment-components/role-master-quick-add';
import { RolePermissionsMatrix } from './components/role-permissions-matrix';
import { RoleStaffListDialog } from './components/role-staff-list-dialog';
import { toast } from 'sonner';
import { Container } from '@/components/common/container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SortField = 'name' | 'description' | 'is_active' | 'assigned_count';
type SortDirection = 'asc' | 'desc';

export function RolesPage() {
  const { roles = [], refresh: refreshRoles } = useRoles();
  const { mutateAsync: addRole } = useAddRole();
  const { mutateAsync: updateRole } = useUpdateRole();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [viewingStaffRole, setViewingStaffRole] = useState<{ id: string, name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAndFilteredRoles = useMemo(() => {
    const filtered = roles.filter((role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aVal: any = a[sortField] || '';
      let bVal: any = b[sortField] || '';

      if (sortField === 'is_active') {
        aVal = a.is_active ? 1 : 0;
        bVal = b.is_active ? 1 : 0;
      } else if (sortField === 'assigned_count') {
        aVal = a.assigned_count || 0;
        bVal = b.assigned_count || 0;
      } else {
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [roles, searchQuery, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingRole(null);
    setShowAddDialog(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setShowAddDialog(true);
  };

  const handleToggleStatus = async (role: Role) => {
    const newStatus = !role.is_active;
    try {
      await updateRole({ id: role.id, updates: { is_active: newStatus } });
      toast.success(`Role ${newStatus ? 'activated' : 'deactivated'} successfully`);
      refreshRoles();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to ${newStatus ? 'activate' : 'deactivate'} role: ` + err.message);
    }
  };

  const handleSave = async (roleData: Partial<Role>) => {
    try {
      if (editingRole) {
        await updateRole({ id: editingRole.id, updates: roleData });
        toast.success('Role updated successfully');
      } else {
        await addRole(roleData as Omit<Role, 'id' | 'created_at' | 'updated_at'>);
        toast.success('Role added successfully');
      }
      setShowAddDialog(false);
      refreshRoles();
    } catch (error) {
      const err = error as Error;
      toast.error(`Failed to ${editingRole ? 'update' : 'add'} role: ` + err.message);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="size-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />;
  };

  return (
    <Container>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2 lg:gap-5">
          <div className="flex flex-col justify-center gap-1">
            <h1 className="text-xl font-bold leading-none text-gray-900">
              Roles & Permissions
            </h1>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              Manage system access levels and granular permissions.
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Button onClick={handleAdd}>
              <Plus className="size-4 me-2" />
              Add Role
            </Button>
          </div>
        </div>

        <Tabs defaultValue="matrix" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="matrix" className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Permission Matrix
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <List className="size-4" />
              Role Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="mt-5">
            <RolePermissionsMatrix />
          </TabsContent>

          <TabsContent value="roles" className="mt-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base font-semibold">System Roles</CardTitle>
                <div className="w-full max-w-sm">
                  <div className="relative">
                    <Input
                      placeholder="Search roles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <Users className="size-4" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('name')}
                          className="h-8 px-2"
                        >
                          Name
                          {getSortIcon('name')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('description')}
                          className="h-8 px-2"
                        >
                          Description
                          {getSortIcon('description')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('assigned_count')}
                          className="h-8 px-2"
                        >
                          Staff Assigned
                          {getSortIcon('assigned_count')}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('is_active')}
                          className="h-8 px-2"
                        >
                          Status
                          {getSortIcon('is_active')}
                        </Button>
                      </TableHead>
                      <TableHead className="w-[100px] text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAndFilteredRoles.length > 0 ? (
                      sortedAndFilteredRoles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.name}</TableCell>
                          <TableCell>{role.description || '-'}</TableCell>
                          <TableCell>
                            <button 
                              onClick={() => setViewingStaffRole({ id: role.id, name: role.name })}
                              className="group"
                            >
                              <Badge 
                                variant="outline" 
                                className="font-mono cursor-pointer hover:border-primary hover:text-primary transition-colors"
                              >
                                {role.assigned_count || 0} users
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge variant={role.is_active ? 'success' : 'secondary'}>
                              {role.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(role)}
                                title="Edit Role"
                                disabled={!canEdit}
                              >
                                <Edit className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(role)}
                                disabled={!canEdit}
                              >
                                {role.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                          No roles found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RoleMasterQuickAdd
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSave={handleSave}
        role={editingRole}
      />

      <RoleStaffListDialog
        roleId={viewingStaffRole?.id || null}
        roleName={viewingStaffRole?.name || null}
        onClose={() => setViewingStaffRole(null)}
      />
    </Container>
  );
}
