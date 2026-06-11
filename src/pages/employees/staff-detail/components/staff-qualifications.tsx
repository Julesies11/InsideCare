import { useCallback, useEffect, useMemo, useState } from 'react';
import { staffDetailsApi } from '@/api/staff-details.api';
import { StaffPendingChanges } from '@/models/staff-pending-changes';
import { differenceInDays, format, parseISO } from 'date-fns';
import {
  CheckSquare,
  Clock,
  Download,
  Edit,
  ExternalLink,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { StaffQualification, useStaffQualifications } from '@/hooks/use-staff';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface StaffQualificationsSectionProps {
  staffId?: string;
  canEdit: boolean;
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
  refreshKey?: number;
}

type QualificationStatus = 'Current' | 'Expiring Soon' | 'Expired';

function calculateQualificationStatus(
  expiryDate?: string | null,
): QualificationStatus {
  if (!expiryDate) return 'Current';

  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, today);

  if (daysUntilExpiry < 0) return 'Expired';
  if (daysUntilExpiry <= 30) return 'Expiring Soon';
  return 'Current';
}

function getStatusBadgeVariant(
  status: QualificationStatus,
): 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'Current':
      return 'success';
    case 'Expiring Soon':
      return 'warning';
    case 'Expired':
      return 'destructive';
  }
}

export function StaffQualificationsSection({
  staffId,
  canEdit,
  pendingChanges,
  onPendingChangesChange,
  refreshKey = 0,
}: StaffQualificationsSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<StaffQualification | null>(
    null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    institution: '',
    date_completed: '',
    expiry_date: '',
  });

  const {
    qualifications: serverQualifications,
    loading,
    refresh,
  } = useStaffQualifications(staffId);

  // Trigger refresh when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      refresh();
    }
  }, [refreshKey, refresh]);

  const handleAdd = () => {
    setEditingItem(null);
    setSelectedFile(null);
    setFormData({
      title: '',
      institution: '',
      date_completed: '',
      expiry_date: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (
    item: StaffQualification | (StaffQualification & { tempId: string }),
  ) => {
    setEditingItem(item as StaffQualification);
    setSelectedFile(null);
    setFormData({
      title: item.title,
      institution: item.institution || '',
      date_completed: item.date_completed || '',
      expiry_date: item.expiry_date || '',
    });
    setShowDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingItem) {
      if ((editingItem as any).tempId) {
        const newPending = {
          ...pendingChanges,
          qualifications: {
            ...pendingChanges.qualifications,
            toAdd: pendingChanges.qualifications.toAdd.map((item: any) =>
              item.tempId === (editingItem as any).tempId
                ? {
                    ...item,
                    ...formData,
                    file: (editingItem as any)._removeFile
                      ? null
                      : selectedFile || item.file,
                    fileName: (editingItem as any)._removeFile
                      ? null
                      : selectedFile?.name || item.fileName,
                  }
                : item,
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        const newPending = {
          ...pendingChanges,
          qualifications: {
            ...pendingChanges.qualifications,
            toUpdate: [
              ...pendingChanges.qualifications.toUpdate.filter(
                (p: any) => p.id !== editingItem.id,
              ),
              {
                id: editingItem.id,
                ...formData,
                file: (editingItem as any)._removeFile ? null : selectedFile,
                fileName: (editingItem as any)._removeFile
                  ? null
                  : selectedFile?.name,
                filePath: editingItem.file_path,
              },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        qualifications: {
          ...pendingChanges.qualifications,
          toAdd: [
            ...pendingChanges.qualifications.toAdd,
            {
              tempId,
              ...formData,
              file: selectedFile,
              fileName: selectedFile?.name,
            },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowDialog(false);
    setSelectedFile(null);
  };

  const handleDelete = (item: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    if (item.tempId) {
      const newPending = {
        ...pendingChanges,
        qualifications: {
          ...pendingChanges.qualifications,
          toAdd: pendingChanges.qualifications.toAdd.filter(
            (p: any) => p.tempId !== item.tempId,
          ),
        },
      };
      onPendingChangesChange(newPending);
      return;
    }

    if (
      confirm(
        'Mark this qualification record for deletion? It will be removed when you click Save Changes.',
      )
    ) {
      const newPending = {
        ...pendingChanges,
        qualifications: {
          ...pendingChanges.qualifications,
          toDelete: [
            ...pendingChanges.qualifications.toDelete,
            {
              id: item.id,
              filePath: item.file_path,
              fileName: item.file_name,
            },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleUndoUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      qualifications: {
        ...pendingChanges.qualifications,
        toUpdate: pendingChanges.qualifications.toUpdate.filter(
          (p: any) => p.id !== id,
        ),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleUndoDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      qualifications: {
        ...pendingChanges.qualifications,
        toDelete: pendingChanges.qualifications.toDelete.filter(
          (item: any) => item.id !== id,
        ),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleViewFile = async (filePath: string) => {
    try {
      const signedUrl = await staffDetailsApi.documents.getAttachmentSignedUrl(
        filePath,
      );
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error('Failed to open document');
    }
  };

  const visibleQualifications = useMemo(() => {
    const fromServer = (serverQualifications || []).filter(
      (item) =>
        !pendingChanges?.qualifications.toDelete.some((d) => d.id === item.id),
    );
    // Apply updates from pending changes
    const withUpdates = fromServer.map((item) => {
      const update = pendingChanges?.qualifications.toUpdate.find(
        (u) => u.id === item.id,
      );
      return update ? { ...item, ...update } : item;
    });

    return [...withUpdates, ...(pendingChanges?.qualifications.toAdd || [])];
  }, [serverQualifications, pendingChanges?.qualifications]);

  const currentStatus = calculateQualificationStatus(
    formData.expiry_date || null,
  );

  return (
    <>
      <Card className="pb-2.5" id="staff_qualifications">
        <CardHeader>
          <CardTitle>Qualifications</CardTitle>
          <Button
            variant="secondary"
            size="sm"
            className="border border-gray-300"
            onClick={handleAdd}
            disabled={!canEdit}
          >
            <Plus className="size-4 me-1.5" />
            Add Qualification
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Loading qualifications...
            </div>
          ) : visibleQualifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No qualifications available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Qualification Title</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Date Completed</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleQualifications.map((item) => {
                  const isPendingAdd = 'tempId' in item;
                  const isPendingUpdate =
                    pendingChanges?.qualifications.toUpdate.some(
                      (p) => p.id === item.id,
                    );
                  const isPendingDelete = item.id
                    ? pendingChanges?.qualifications.toDelete.some(
                        (d) => d.id === item.id,
                      )
                    : false;
                  const status = calculateQualificationStatus(item.expiry_date);
                  const itemFileName =
                    (item as any).fileName || (item as any).file_name;
                  const itemFilePath =
                    (item as any).filePath || (item as any).file_path;
                  const hasFile = itemFilePath || (item as any).file;

                  return (
                    <TableRow
                      key={item.id || (item as any).tempId}
                      className={
                        isPendingAdd
                          ? 'bg-primary/5'
                          : isPendingDelete
                            ? 'opacity-50 bg-destructive/5'
                            : isPendingUpdate
                              ? 'bg-warning/5'
                              : ''
                      }
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className={cn(
                              'font-medium text-gray-900 dark:text-gray-100',
                              isPendingDelete && 'line-through',
                            )}
                          >
                            {item.title}
                          </span>
                          {(isPendingAdd ||
                            isPendingUpdate ||
                            isPendingDelete) && (
                            <span
                              className={cn(
                                'text-[10px] flex items-center gap-1',
                                isPendingAdd
                                  ? 'text-primary'
                                  : isPendingUpdate
                                    ? 'text-warning'
                                    : 'text-destructive',
                              )}
                            >
                              <Clock className="size-3" />
                              Pending{' '}
                              {isPendingAdd
                                ? 'add'
                                : isPendingUpdate
                                  ? 'update'
                                  : 'deletion'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.institution}</TableCell>
                      <TableCell>
                        {item.date_completed
                          ? format(parseISO(item.date_completed), 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {item.expiry_date
                          ? format(parseISO(item.expiry_date), 'dd/MM/yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(status)}
                          size="sm"
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasFile ? (
                          <div className="flex items-center gap-2 max-w-[120px]">
                            <FileText className="size-3.5 text-primary shrink-0" />
                            <span
                              className="text-[10px] text-muted-foreground truncate"
                              title={itemFileName || 'File'}
                            >
                              {itemFileName || 'File attached'}
                            </span>
                            {itemFilePath && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 shrink-0"
                                onClick={() => handleViewFile(itemFilePath)}
                                title="View document"
                              >
                                <ExternalLink className="size-3.5 text-primary" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">
                            No document
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                disabled={!canEdit}
                              >
                                <Edit className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDelete(item)}
                                disabled={!canEdit}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                          {isPendingUpdate && item.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUndoUpdate(item.id!)}
                              disabled={!canEdit}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && item.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUndoDelete(item.id!)}
                              disabled={!canEdit}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Qualification' : 'Add Qualification'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update qualification record details'
                : 'Add a new qualification record'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Qualification title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) =>
                    setFormData({ ...formData, institution: e.target.value })
                  }
                  placeholder="e.g., University, TAFE"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_completed">Date Completed</Label>
                <Input
                  id="date_completed"
                  type="date"
                  value={formData.date_completed || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date_completed: e.target.value || '',
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expiry_date: e.target.value || '',
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center h-10">
                <Badge variant={getStatusBadgeVariant(currentStatus)} size="sm">
                  {currentStatus}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Qualification Document</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="flex-1"
                />
                {(selectedFile || editingItem?.file_name) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/20 hover:bg-destructive/5 gap-2"
                    onClick={() => {
                      setSelectedFile(null);
                      if (editingItem) {
                        (editingItem as any)._removeFile = true;
                      }
                      const input = document.getElementById(
                        'file',
                      ) as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </Button>
                )}
              </div>

              {selectedFile ? (
                <p className="text-[10px] text-primary font-bold flex items-center gap-1.5 mt-1 animate-pulse">
                  <CheckSquare className="size-3" />
                  New file selected: {selectedFile.name}
                </p>
              ) : editingItem?.file_name ? (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-1">
                  <FileText className="size-3" />
                  Current file: {editingItem.file_name}
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
