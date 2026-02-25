import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users, Clock, Star } from 'lucide-react';
import { useHouseStaffAssignments } from '@/hooks/useHouseStaffAssignmentsForHouse';
import { useStaff } from '@/hooks/useStaff';
import { StaffCombobox } from './staff-combobox';
import { HousePendingChanges } from '@/models/house-pending-changes';

interface StaffProps {
  houseId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

export function HouseStaff({ 
  houseId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: StaffProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    is_primary: false,
    start_date: '',
    end_date: '',
    notes: '',
  });

  const { houseStaffAssignments, loading } = useHouseStaffAssignments(houseId);
  const { staff } = useStaff();

  const handleAdd = () => {
    setEditingStaff(null);
    setFormData({
      staff_id: '',
      is_primary: false,
      start_date: '',
      end_date: '',
      notes: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (staffAssignment: any) => {
    setEditingStaff(staffAssignment);
    setFormData({
      staff_id: staffAssignment.staff_id || '',
      is_primary: staffAssignment.is_primary || false,
      start_date: staffAssignment.start_date || '',
      end_date: staffAssignment.end_date || '',
      notes: staffAssignment.notes || '',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.staff_id.trim()) {
      return;
    }
    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingStaff) {
      // Update existing staff assignment
      if (editingStaff.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          staff: {
            ...pendingChanges.staff,
            toAdd: pendingChanges.staff.toAdd.map(staff =>
              staff.tempId === editingStaff.tempId ? { ...staff, ...formData } : staff
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          staff: {
            ...pendingChanges.staff,
            toUpdate: [
              ...pendingChanges.staff.toUpdate.filter(s => s.id !== editingStaff.id),
              { id: editingStaff.id, ...formData },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new staff assignment
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        staff: {
          ...pendingChanges.staff,
          toAdd: [
            ...pendingChanges.staff.toAdd,
            { tempId, ...formData },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowDialog(false);
  };

  const handleDelete = (staffAssignment: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (staffAssignment.tempId) {
      handleCancelPendingAdd(staffAssignment.tempId);
      return;
    }

    // Otherwise, mark existing staff assignment for deletion
    if (confirm('Mark this staff assignment for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        staff: {
          ...pendingChanges.staff,
          toDelete: [...pendingChanges.staff.toDelete, staffAssignment.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      staff: {
        ...pendingChanges.staff,
        toAdd: pendingChanges.staff.toAdd.filter(staff => staff.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      staff: {
        ...pendingChanges.staff,
        toUpdate: pendingChanges.staff.toUpdate.filter(staff => staff.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      staff: {
        ...pendingChanges.staff,
        toDelete: pendingChanges.staff.toDelete.filter(staffId => staffId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  // Helper function to get staff name
  const getStaffName = (staffAssignment: any) => {
    // If staff assignment has staff object (from database join), use it
    if (staffAssignment.staff?.name) {
      return staffAssignment.staff.name;
    }
    // Otherwise, look up by staff_id (for pending assignments)
    if (staffAssignment.staff_id) {
      const staffMember = staff.find(s => s.id === staffAssignment.staff_id);
      return staffMember?.name || 'Unknown Staff';
    }
    return 'Unknown Staff';
  };

  // Helper function to get staff email
  const getStaffEmail = (staffAssignment: any) => {
    if (staffAssignment.staff?.email) {
      return staffAssignment.staff.email;
    }
    if (staffAssignment.staff_id) {
      const staffMember = staff.find(s => s.id === staffAssignment.staff_id);
      return staffMember?.email || '';
    }
    return '';
  };

  // Helper function to get staff phone
  const getStaffPhone = (staffAssignment: any) => {
    if (staffAssignment.staff?.phone) {
      return staffAssignment.staff.phone;
    }
    if (staffAssignment.staff_id) {
      const staffMember = staff.find(s => s.id === staffAssignment.staff_id);
      return staffMember?.phone || '';
    }
    return '';
  };

  // Helper function to get staff role
  const getStaffRole = (staffAssignment: any) => {
    // If staff assignment has staff object with role (from database join), use it
    if (staffAssignment.staff?.role?.name) {
      return staffAssignment.staff.role.name;
    }
    // Otherwise, look up by staff_id (for pending assignments)
    if (staffAssignment.staff_id) {
      const staffMember = staff.find(s => s.id === staffAssignment.staff_id);
      return staffMember?.role?.name || 'No Role';
    }
    return 'No Role';
  };

  // Combine existing staff assignments with pending adds, filter out pending deletes
  const visibleStaffAssignments = [
    ...houseStaffAssignments.filter(staff => !pendingChanges?.staff.toDelete.includes(staff.id)),
    ...(pendingChanges?.staff.toAdd || []),
  ];

  return (
    <>
      <Card className="pb-2.5" id="staff">
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!houseId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Staff
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading staff assignments...</div>
          ) : visibleStaffAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No staff assigned to this house</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleStaffAssignments.map((staffAssignment) => {
                  const isPendingAdd = 'tempId' in staffAssignment;
                  const isPendingUpdate = pendingChanges?.staff.toUpdate.some(s => s.id === staffAssignment.id);
                  const isPendingDelete = pendingChanges?.staff.toDelete.includes(staffAssignment.id);
                  const isActive = !staffAssignment.end_date || new Date(staffAssignment.end_date) > new Date();
                  
                  return (
                    <TableRow 
                      key={staffAssignment.id || staffAssignment.tempId} 
                      className={
                        isPendingAdd ? 'bg-primary/5' : 
                        isPendingDelete ? 'opacity-50 bg-destructive/5' : 
                        isPendingUpdate ? 'bg-warning/5' : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="size-4 text-muted-foreground" />
                          <div className={`flex flex-col ${isPendingDelete ? 'line-through' : ''}`}>
                            <span className="font-medium">{getStaffName(staffAssignment)}</span>
                            {staffAssignment.is_primary && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Star className="size-3" />
                                Primary
                              </div>
                            )}
                          </div>
                          {isPendingAdd && (
                            <span className="text-xs text-primary flex items-center gap-1">
                              <Clock className="size-3" />
                              Pending add
                            </span>
                          )}
                          {isPendingUpdate && (
                            <span className="text-xs text-warning flex items-center gap-1">
                              <Clock className="size-3" />
                              Pending update
                            </span>
                          )}
                          {isPendingDelete && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <Clock className="size-3" />
                              Pending deletion
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{getStaffEmail(staffAssignment) || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{getStaffPhone(staffAssignment) || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getStaffRole(staffAssignment)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {staffAssignment.start_date ? new Date(staffAssignment.start_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {staffAssignment.end_date ? new Date(staffAssignment.end_date).toLocaleDateString() : 'Ongoing'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isActive ? 'success' : 'secondary'}>
                          {isActive ? 'Active' : 'Ended'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(staffAssignment)}>
                                <Edit className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(staffAssignment)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {isPendingAdd && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingAdd(staffAssignment.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(staffAssignment.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(staffAssignment.id)}
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Assignment' : 'Add Staff Assignment'}</DialogTitle>
            <DialogDescription>
              {editingStaff
                ? 'Update staff assignment details'
                : 'Assign a staff member to this house'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staff_id">Staff Member *</Label>
              <StaffCombobox
                value={formData.staff_id}
                onChange={(value) => setFormData({ ...formData, staff_id: value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about this staff assignment"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
              />
              <Label htmlFor="is_primary">Primary Staff Member</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
