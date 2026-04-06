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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Edit, Trash2, Users, Clock, Star } from 'lucide-react';
import { useHouseStaffAssignments } from '@/hooks/use-house-staff-assignments';
import { useStaff } from '@/hooks/use-staff';
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
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [editingStaff, setEditingStaff] = useState<{ id?: string; tempId?: string; staff_id: string; is_primary?: boolean; start_date?: string; end_date?: string; notes?: string } | null>(null);
  const [formData, setFormData] = useState({
    staff_id: '',
    is_primary: false,
    start_date: '',
    end_date: '',
    notes: '',
  });

  const { data: houseStaffAssignments = [], isLoading: loading } = useHouseStaffAssignments(houseId);
  const { staff } = useStaff(0, 100, [], { statuses: ['active'] });

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

  const handleEdit = (staffAssignment: { id?: string; tempId?: string; staff_id: string; is_primary?: boolean; start_date?: string; end_date?: string; notes?: string }) => {
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

    const staffMember = staff.find(s => s.id === formData.staff_id);
    const payload = {
      ...formData,
      staff_name: staffMember?.name || undefined,
    };

    if (editingStaff) {
      // Update existing staff assignment
      if (editingStaff.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          staff: {
            ...pendingChanges.staff,
            toAdd: pendingChanges.staff.toAdd.map(staff =>
              staff.tempId === editingStaff.tempId ? { ...staff, ...payload } : staff
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
              { id: editingStaff.id, ...payload },
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
            { tempId, ...payload },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowDialog(false);
  };

  const handleDelete = (staffAssignment: { id: string; tempId?: string }) => {
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
    if (staffAssignment.staff?.name) return staffAssignment.staff.name;
    if (staffAssignment.staff_id) {
      const member = staff.find(s => s.id === staffAssignment.staff_id);
      return member?.name || 'Unknown Staff';
    }
    return 'Unknown Staff';
  };

  // Helper function to get staff photo
  const getStaffPhoto = (staffAssignment: any) => {
    if (staffAssignment.staff?.photo_url) return staffAssignment.staff.photo_url;
    if (staffAssignment.staff_id) {
      const member = staff.find(s => s.id === staffAssignment.staff_id);
      return member?.photo_url || null;
    }
    return null;
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
    ...houseStaffAssignments.filter(staff => {
      const isDeleted = pendingChanges?.staff.toDelete.includes(staff.id);
      if (isDeleted) return false;
      
      if (showOnlyActive) {
        const today = new Date().toISOString().split('T')[0];
        const isAssignmentActive = !staff.end_date || staff.end_date >= today;
        const isStaffActive = staff.staff?.status === 'active';
        return isAssignmentActive && isStaffActive;
      }
      
      return true;
    }),
    ...(pendingChanges?.staff.toAdd || []),
  ];

  return (
    <>
      <Card className="pb-2.5" id="staff">
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>Staff</CardTitle>
            <p className="text-xs text-muted-foreground">Manage personnel assigned to this house</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Switch
                id="show-only-active"
                checked={showOnlyActive}
                onCheckedChange={setShowOnlyActive}
              />
              <Label htmlFor="show-only-active" className="text-xs font-bold cursor-pointer">Active Only</Label>
            </div>
            <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!houseId || !canAdd}>
              <Plus className="size-4 me-1.5" />
              Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading staff assignments...</div>
          ) : visibleStaffAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No staff assigned to this house</div>
          ) : (
            <div className="overflow-x-auto"><Table>
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
                  
                  const isAssignmentActive = !staffAssignment.end_date || new Date(staffAssignment.end_date) > new Date();
                  const isStaffActive = staffAssignment.staff?.status === 'active';
                  
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
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            {getStaffPhoto(staffAssignment) && (
                              <AvatarImage src={getStaffPhoto(staffAssignment)} alt={getStaffName(staffAssignment)} />
                            )}
                            <AvatarFallback>
                              {getStaffName(staffAssignment).split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex flex-col ${isPendingDelete ? 'line-through' : ''}`}>
                            <span className="font-bold text-gray-900">{getStaffName(staffAssignment)}</span>
                            {staffAssignment.is_primary && (
                              <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase tracking-tight">
                                <Star className="size-3 fill-blue-600" />
                                House Lead
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 ml-auto">
                            {isPendingAdd && (
                              <span className="text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-1">
                                <Clock className="size-3" />
                                New
                              </span>
                            )}
                            {isPendingUpdate && (
                              <span className="text-[10px] text-warning font-bold uppercase tracking-widest flex items-center gap-1">
                                <Clock className="size-3" />
                                Updated
                              </span>
                            )}
                            {isPendingDelete && (
                              <span className="text-[10px] text-destructive font-bold uppercase tracking-widest flex items-center gap-1">
                                <Clock className="size-3" />
                                Removing
                              </span>
                            )}
                          </div>
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
                        <div className="flex flex-col gap-1 items-start">
                          {isAssignmentActive && isStaffActive && (
                            <Badge variant="success">Active</Badge>
                          )}
                          {isAssignmentActive && !isStaffActive && !isPendingAdd && (
                            <div className="flex flex-col gap-1">
                              <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 border-none uppercase tracking-widest text-[9px] font-black">Inactive</Badge>
                              <span className="text-[10px] text-orange-600 font-bold italic uppercase">Employment: {staffAssignment.staff?.status || 'Unknown'}</span>
                            </div>
                          )}
                          {!isAssignmentActive && (
                            <Badge variant="secondary">Assignment Ended</Badge>
                          )}
                          {isPendingAdd && (
                            <Badge variant="outline" className="border-primary text-primary">New Assignment</Badge>
                          )}
                        </div>
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
            </Table></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="px-5 py-2 border-b bg-white sticky top-0 z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-col">
                <DialogTitle className="text-base font-black uppercase tracking-tight">
                  {editingStaff ? 'Edit Assignment' : 'Add Assignment'}
                </DialogTitle>
                <DialogDescription className="text-[9px] font-medium mt-0 leading-none">
                  {editingStaff ? 'Update house linking' : 'Link staff to house'}
                </DialogDescription>
              </div>

              {/* Compact Read-only Header Info */}
              {formData.staff_id && (
                <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Status</span>
                    <Badge 
                      variant={staff.find(s => s.id === formData.staff_id)?.status === 'active' ? 'success' : 'secondary'}
                      className="uppercase text-[7px] font-black tracking-widest px-1 h-3"
                    >
                      {staff.find(s => s.id === formData.staff_id)?.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="w-px h-5 bg-gray-200" />
                  <div className="flex flex-col items-start">
                    <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-0.5">Role</span>
                    <span className="text-[9px] font-bold text-gray-700 leading-none">
                      {staff.find(s => s.id === formData.staff_id)?.role?.name || 'None'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="px-5 py-3 space-y-2.5 bg-gray-50/30">
            <div className="space-y-1">
              {editingStaff ? (
                <div className="bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-1">Assigned Staff</span>
                  <span className="text-sm font-black text-gray-900">
                    {staff.find(s => s.id === formData.staff_id)?.name || 'Unknown Staff'}
                  </span>
                </div>
              ) : (
                <StaffCombobox
                  value={formData.staff_id}
                  onChange={(value) => setFormData({ ...formData, staff_id: value })}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="start_date" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="bg-white h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end_date" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="bg-white h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Additional notes..."
                className="bg-white resize-none text-sm"
              />
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
              <Switch
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
              />
              <Label htmlFor="is_primary" className="text-xs font-bold text-gray-700 cursor-pointer">Primary Staff Member</Label>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-white sticky bottom-0 z-10 flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} className="flex-1 sm:flex-none">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
