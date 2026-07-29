import { useState } from 'react';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { useStaffHouseAssignments } from '@/hooks/use-staff-house-assignments';
import { useActiveHouses } from '@/hooks/use-houses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { HouseCombobox } from './house-combobox';
import { Link } from 'react-router';
import { ROUTES } from '@/config/routes.config';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  Home,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface StaffHousesProps {
  staffId: string;
  canEdit: boolean;
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
}

export function StaffHousesSection({
  staffId,
  canEdit,
  pendingChanges,
  onPendingChangesChange,
}: StaffHousesProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<{
    id?: string;
    tempId?: string;
    house_id: string;
    is_primary?: boolean;
    start_date?: string;
    end_date?: string;
    notes?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    house_id: '',
    is_primary: false,
    start_date: '',
    end_date: '',
    notes: '',
  });

  const { assignments = [], isLoading: loading } =
    useStaffHouseAssignments(staffId);
  const { data: houses = [] } = useActiveHouses();

  const handleAdd = () => {
    setEditingAssignment(null);
    setFormData({
      house_id: '',
      is_primary: false,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setFormData({
      house_id: assignment.house_id || '',
      is_primary: assignment.is_primary || false,
      start_date: assignment.start_date || '',
      end_date: assignment.end_date || '',
      notes: assignment.notes || '',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.house_id.trim()) {
      toast.error('House is required');
      return;
    }
    if (!formData.start_date.trim()) {
      toast.error('Start Date is required');
      return;
    }
    if (!pendingChanges || !onPendingChangesChange) return;

    const houseObj = houses.find((h) => h.id === formData.house_id);
    const payload = {
      ...formData,
      house_name: houseObj?.house_name || 'Unknown House',
      house: houseObj
        ? {
            id: houseObj.id,
            house_name: houseObj.house_name,
            status: houseObj.status,
          }
        : undefined,
    };

    if (editingAssignment) {
      if (editingAssignment.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          houseAssignments: {
            ...pendingChanges.houseAssignments,
            toAdd: pendingChanges.houseAssignments.toAdd.map((a) =>
              a.tempId === editingAssignment.tempId ? { ...a, ...payload } : a,
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          houseAssignments: {
            ...pendingChanges.houseAssignments,
            toUpdate: [
              ...pendingChanges.houseAssignments.toUpdate.filter(
                (a) => a.id !== editingAssignment.id,
              ),
              { id: editingAssignment.id, ...payload },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new assignment
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        houseAssignments: {
          ...pendingChanges.houseAssignments,
          toAdd: [
            ...pendingChanges.houseAssignments.toAdd,
            { tempId, ...payload },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowDialog(false);
    toast.info('House assignment pending save');
  };

  const handleDelete = (assignment: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (assignment.tempId) {
      handleCancelPendingAdd(assignment.tempId);
      return;
    }

    if (
      confirm(
        'Mark this house assignment for deletion? It will be removed when you click Save Changes.',
      )
    ) {
      const newPending = {
        ...pendingChanges,
        houseAssignments: {
          ...pendingChanges.houseAssignments,
          toDelete: [...pendingChanges.houseAssignments.toDelete, assignment.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      houseAssignments: {
        ...pendingChanges.houseAssignments,
        toAdd: pendingChanges.houseAssignments.toAdd.filter(
          (a) => a.tempId !== tempId,
        ),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      houseAssignments: {
        ...pendingChanges.houseAssignments,
        toUpdate: pendingChanges.houseAssignments.toUpdate.filter(
          (a) => a.id !== id,
        ),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      houseAssignments: {
        ...pendingChanges.houseAssignments,
        toDelete: pendingChanges.houseAssignments.toDelete.filter(
          (aId) => aId !== id,
        ),
      },
    };
    onPendingChangesChange(newPending);
  };

  const today = new Date().toISOString().split('T')[0];

  // Combine server assignments (excluding deleted) and updates/adds
  const allAssignments = [
    ...assignments
      .filter((a) => !pendingChanges?.houseAssignments.toDelete.includes(a.id))
      .map((a) => {
        const updated = pendingChanges?.houseAssignments.toUpdate.find(
          (u) => u.id === a.id,
        );
        return updated ? { ...a, ...updated } : a;
      }),
    ...(pendingChanges?.houseAssignments.toAdd || []),
  ];

  // Helper to check if assignment is fully active (active assignment AND active house status)
  const isFullyActive = (a: any) => {
    const isEnded = a.end_date && a.end_date < today;
    const isHouseInactive = a.house?.status ? a.house.status !== 'active' : false;
    return !isEnded && !isHouseInactive;
  };

  // Sort: Active first, then inactive/ended, then by start date descending
  const sortedAssignments = [...allAssignments].sort((a, b) => {
    const activeA = isFullyActive(a);
    const activeB = isFullyActive(b);
    if (activeA && !activeB) return -1;
    if (!activeA && activeB) return 1;
    return (b.start_date || '').localeCompare(a.start_date || '');
  });

  const renderStatus = (assignment: any) => {
    const isEnded = assignment.end_date && assignment.end_date < today;
    const isHouseInactive = assignment.house?.status ? assignment.house.status !== 'active' : false;

    if (isHouseInactive) {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 border-none uppercase tracking-widest text-[9px] font-black">
            House Inactive
          </Badge>
          <span className="text-[10px] text-orange-600 font-bold italic uppercase">
            {assignment.house?.status || 'Inactive'}
          </span>
        </div>
      );
    }
    if (isEnded) {
      return (
        <Badge variant="secondary" className="uppercase tracking-widest text-[9px] font-black">
          Ended
        </Badge>
      );
    }
    if ('tempId' in assignment) {
      return (
        <Badge variant="outline" className="border-primary text-primary uppercase tracking-widest text-[9px] font-black">
          Pending Save
        </Badge>
      );
    }
    return (
      <Badge variant="success" className="uppercase tracking-widest text-[9px] font-black">
        Active
      </Badge>
    );
  };

  return (
    <>
      <Card className="pb-2.5" id="house_assignments">
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>House Assignments</CardTitle>
            <p className="text-xs text-muted-foreground">
              Manage houses where this staff member is assigned
            </p>
          </div>
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              className="border border-gray-300"
              onClick={handleAdd}
            >
              <Plus className="size-4 me-1.5" />
              Assign to House
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Loading house assignments...
            </div>
          ) : sortedAssignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg bg-gray-50/50">
              No house assignments.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>House</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAssignments.map((assignment: any) => {
                    const isPendingAdd = 'tempId' in assignment;
                    const isPendingUpdate =
                      pendingChanges?.houseAssignments.toUpdate.some(
                        (a) => a.id === assignment.id,
                      );
                    const isPendingDelete =
                      pendingChanges?.houseAssignments.toDelete.includes(
                        assignment.id,
                      );

                    const isEnded = assignment.end_date && assignment.end_date < today;
                    const isHouseInactive = assignment.house?.status ? assignment.house.status !== 'active' : false;

                    const houseName =
                      assignment.house?.house_name ||
                      assignment.house_name ||
                      'Unknown House';

                    return (
                      <TableRow
                        key={assignment.id || assignment.tempId}
                        className={cn(
                          isPendingAdd && 'bg-primary/5',
                          isPendingDelete && 'opacity-50 bg-destructive/5',
                          isPendingUpdate && 'bg-warning/5',
                          isHouseInactive && !isPendingDelete && !isPendingAdd && !isPendingUpdate && 'bg-amber-50/30 border-l-2 border-l-orange-500',
                          isEnded && !isHouseInactive && !isPendingDelete && !isPendingAdd && !isPendingUpdate && 'opacity-70 bg-gray-50/30'
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className={cn(
                              "size-4 shrink-0",
                              isHouseInactive ? "text-orange-500" : "text-muted-foreground"
                            )} />
                            <div className="flex flex-col">
                              {assignment.house_id ? (
                                <Link
                                  to={`${ROUTES.HOUSE_DETAIL}/${assignment.house_id}`}
                                  className={cn(
                                    "font-medium hover:underline transition-colors",
                                    isHouseInactive ? "text-orange-700 dark:text-orange-400" : "text-blue-700 dark:text-blue-400"
                                  )}
                                >
                                  {houseName}
                                </Link>
                              ) : (
                                <span className="font-medium">{houseName}</span>
                              )}
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {isPendingAdd && (
                                  <span className="text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-0.5">
                                    <Clock className="size-3" /> Pending save
                                  </span>
                                )}
                                {isPendingUpdate && (
                                  <span className="text-[10px] text-warning font-bold uppercase tracking-widest flex items-center gap-0.5">
                                    <Clock className="size-3" /> Updated
                                  </span>
                                )}
                                {isPendingDelete && (
                                  <span className="text-[10px] text-destructive font-bold uppercase tracking-widest flex items-center gap-0.5">
                                    <Clock className="size-3" /> Removing
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.is_primary ? (
                            <Badge
                              variant="success"
                              className={cn(
                                "uppercase tracking-wider text-[9px] font-black flex items-center gap-1 w-fit border-none",
                                isHouseInactive
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              )}
                            >
                              <Star className={cn(
                                "size-3",
                                isHouseInactive ? "fill-amber-600 stroke-amber-600" : "fill-blue-600 stroke-blue-600"
                              )} />
                              House Lead
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Support Staff
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {assignment.start_date
                            ? new Date(assignment.start_date).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {assignment.end_date ? (
                            new Date(assignment.end_date).toLocaleDateString()
                          ) : (
                            <span className={cn(isHouseInactive ? "text-orange-600" : "text-green-600 font-medium")}>
                              Ongoing
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {renderStatus(assignment)}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {assignment.notes || '-'}
                        </TableCell>
                        {canEdit && (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {!isPendingDelete && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(assignment)}
                                    title="Edit assignment"
                                  >
                                    <Edit className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => handleDelete(assignment)}
                                    title="Remove assignment"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </>
                              )}
                              {isPendingAdd && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelPendingAdd(assignment.tempId!)
                                  }
                                >
                                  Remove
                                </Button>
                              )}
                              {isPendingUpdate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelPendingUpdate(assignment.id)
                                  }
                                >
                                  Undo
                                </Button>
                              )}
                              {isPendingDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCancelPendingDelete(assignment.id)
                                  }
                                >
                                  Undo
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="px-5 py-2 border-b bg-white sticky top-0 z-10">
            <DialogTitle className="text-base font-black uppercase tracking-tight">
              {editingAssignment ? 'Edit Assignment' : 'Assign to House'}
            </DialogTitle>
            <DialogDescription className="text-[9px] font-medium mt-0 leading-none">
              {editingAssignment
                ? 'Update assignment parameters'
                : 'Assign this staff member to a house'}
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-3 space-y-2.5 bg-gray-50/30">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                House *
              </Label>
              {editingAssignment ? (
                <div className="bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm flex flex-col">
                  <span className="text-sm font-black text-gray-900">
                    {editingAssignment.house_name ||
                      (editingAssignment as any).house?.house_name ||
                      'Unknown House'}
                  </span>
                </div>
              ) : (
                <HouseCombobox
                  value={formData.house_id}
                  onChange={(val) => setFormData({ ...formData, house_id: val })}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="start_date"
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1"
                >
                  Start Date *
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                     setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="bg-white h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="end_date"
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1"
                >
                  End Date
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="bg-white h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="notes"
                className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1"
              >
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
                placeholder="Assignment details or shift requirements..."
                className="bg-white resize-none text-sm"
              />
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
              <Switch
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_primary: checked })
                }
              />
              <Label
                htmlFor="is_primary"
                className="text-xs font-bold text-gray-700 cursor-pointer"
              >
                Primary Lead for this House
              </Label>
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-white sticky bottom-0 z-10 flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="flex-1 sm:flex-none"
            >
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
