import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, ShieldCheck, Clock } from 'lucide-react';
import { useStaff, StaffCompliance } from '@/hooks/useStaff';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PendingChanges } from '@/models/pending-changes';
import { cn } from '@/lib/utils';

interface StaffComplianceSectionProps {
  staffId: string;
  pendingChanges?: PendingChanges;
  onPendingChangesChange?: (changes: PendingChanges) => void;
}

export function StaffComplianceSection({ 
  staffId,
  pendingChanges,
  onPendingChangesChange
}: StaffComplianceSectionProps) {
  const [compliance, setCompliance] = useState<StaffCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<StaffCompliance | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    compliance_name: '',
    completion_date: '',
    expiry_date: '',
    status: 'Complete' as string,
  });

  const { getStaffCompliance } = useStaff();

  const fetchCompliance = async () => {
    setLoading(true);
    const { data } = await getStaffCompliance(staffId);
    if (data) setCompliance(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCompliance();
  }, [staffId]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      compliance_name: '',
      completion_date: '',
      expiry_date: '',
      status: 'Complete',
    });
    setShowDialog(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      compliance_name: item.compliance_name,
      completion_date: item.completion_date || '',
      expiry_date: item.expiry_date || '',
      status: item.status || 'Complete',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.compliance_name.trim()) {
      toast.error('Compliance name is required');
      return;
    }

    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingItem) {
      if ((editingItem as any).tempId) {
        const newPending = {
          ...pendingChanges,
          staffCompliance: {
            ...pendingChanges.staffCompliance,
            toAdd: pendingChanges.staffCompliance.toAdd.map((item: any) =>
              item.tempId === (editingItem as any).tempId ? { ...item, ...formData } : item
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        const newPending = {
          ...pendingChanges,
          staffCompliance: {
            ...pendingChanges.staffCompliance,
            toUpdate: [
              ...pendingChanges.staffCompliance.toUpdate.filter((p: any) => p.id !== editingItem.id),
              { id: editingItem.id, ...formData },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: [
            ...pendingChanges.staffCompliance.toAdd,
            { tempId, ...formData },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowDialog(false);
  };

  const handleDelete = (item: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (item.tempId) {
      const newPending = {
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toAdd: pendingChanges.staffCompliance.toAdd.filter((p: any) => p.tempId !== item.tempId),
        },
      };
      onPendingChangesChange(newPending);
      return;
    }

    if (confirm('Mark this compliance record for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        staffCompliance: {
          ...pendingChanges.staffCompliance,
          toDelete: [...pendingChanges.staffCompliance.toDelete, item.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleUndoUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      staffCompliance: {
        ...pendingChanges.staffCompliance,
        toUpdate: pendingChanges.staffCompliance.toUpdate.filter((p: any) => p.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleUndoDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      staffCompliance: {
        ...pendingChanges.staffCompliance,
        toDelete: pendingChanges.staffCompliance.toDelete.filter((pId: string) => pId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'Complete':
        return <Badge variant="success">Complete</Badge>;
      case 'Expiring Soon':
        return <Badge variant="warning">Expiring Soon</Badge>;
      case 'Expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'Incomplete':
        return <Badge variant="secondary">Incomplete</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const visibleCompliance = [
    ...compliance.filter(item => !pendingChanges?.staffCompliance.toDelete.includes(item.id)),
    ...(pendingChanges?.staffCompliance.toAdd || []),
  ];

  return (
    <>
      <Card className="pb-2.5" id="staff_compliance">
        <CardHeader>
          <CardTitle>Compliance & Training</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd}>
            <Plus className="size-4 me-1.5" />
            Add Requirement
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading compliance data...</div>
          ) : visibleCompliance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No compliance records found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleCompliance.map((item) => {
                  const isPendingAdd = 'tempId' in item;
                  const isPendingUpdate = pendingChanges?.staffCompliance.toUpdate.some((p: any) => p.id === item.id);
                  const isPendingDelete = pendingChanges?.staffCompliance.toDelete.includes(item.id);

                  return (
                    <TableRow 
                      key={item.id || (item as any).tempId}
                      className={
                        isPendingAdd ? 'bg-primary/5' : 
                        isPendingDelete ? 'opacity-50 bg-destructive/5' : 
                        isPendingUpdate ? 'bg-warning/5' : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-muted-foreground" />
                          <span className={cn(
                            "font-medium text-gray-900 dark:text-gray-100",
                            isPendingDelete && "line-through"
                          )}>
                            {item.compliance_name}
                          </span>
                          {(isPendingAdd || isPendingUpdate || isPendingDelete) && (
                            <span className={cn(
                              "text-[10px] flex items-center gap-1",
                              isPendingAdd ? "text-primary" : isPendingUpdate ? "text-warning" : "text-destructive"
                            )}>
                              <Clock className="size-3" />
                              Pending {isPendingAdd ? 'add' : isPendingUpdate ? 'update' : 'deletion'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.completion_date ? format(new Date(item.completion_date), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {item.expiry_date ? format(new Date(item.expiry_date), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                                <Edit className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDelete(item)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                          {isPendingUpdate && (
                            <Button variant="ghost" size="sm" onClick={() => handleUndoUpdate(item.id)}>
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button variant="ghost" size="sm" onClick={() => handleUndoDelete(item.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Compliance Requirement' : 'Add Compliance Requirement'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update compliance details' : 'Add a new compliance requirement for this staff member'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="compliance_name">Requirement Name *</Label>
              <Input
                id="compliance_name"
                value={formData.compliance_name}
                onChange={(e) => setFormData({ ...formData, compliance_name: e.target.value })}
                placeholder="e.g., First Aid Certificate"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="completion_date">Completion Date</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Incomplete">Incomplete</SelectItem>
                  <SelectItem value="Not Required">Not Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
