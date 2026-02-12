import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, FileText, Download, Clock } from 'lucide-react';
import { useStaff, StaffTraining } from '@/hooks/useStaff';
import { toast } from 'sonner';
import { PendingChanges } from '@/models/pending-changes';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface StaffTrainingSectionProps {
  pendingChanges?: PendingChanges;
  onPendingChangesChange?: (changes: PendingChanges) => void;
  refreshKey?: number;
}

type TrainingStatus = 'Current' | 'Expiring Soon' | 'Expired';

function calculateTrainingStatus(expiryDate?: string | null): TrainingStatus {
  if (!expiryDate) return 'Current';
  
  const today = new Date();
  const expiry = parseISO(expiryDate);
  const daysUntilExpiry = differenceInDays(expiry, today);
  
  if (daysUntilExpiry < 0) return 'Expired';
  if (daysUntilExpiry <= 30) return 'Expiring Soon';
  return 'Current';
}

function getStatusBadgeVariant(status: TrainingStatus): "success" | "warning" | "destructive" {
  switch (status) {
    case 'Current':
      return 'success';
    case 'Expiring Soon':
      return 'warning';
    case 'Expired':
      return 'destructive';
  }
}

export function StaffTrainingSection({
  pendingChanges,
  onPendingChangesChange,
  refreshKey = 0
}: StaffTrainingSectionProps) {
  const [training, setTraining] = useState<StaffTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<StaffTraining | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    provider: '',
    date_completed: '',
    expiry_date: '',
  });

  const { getStaffTraining } = useStaff();

  const fetchTraining = async () => {
    setLoading(true);
    const { data } = await getStaffTraining();
    if (data) setTraining(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTraining();
  }, [refreshKey]);

  const handleAdd = () => {
    setEditingItem(null);
    setSelectedFile(null);
    setFormData({
      title: '',
      category: '',
      description: '',
      provider: '',
      date_completed: '',
      expiry_date: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setSelectedFile(null);
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description || '',
      provider: item.provider || '',
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
    if (!formData.title.trim() || !formData.category.trim()) {
      toast.error('Title and Category are required');
      return;
    }

    if (!pendingChanges || !onPendingChangesChange) return;

    if (editingItem) {
      if ((editingItem as any).tempId) {
        const newPending = {
          ...pendingChanges,
          training: {
            ...pendingChanges.training,
            toAdd: pendingChanges.training.toAdd.map((item: any) =>
              item.tempId === (editingItem as any).tempId 
                ? { 
                    ...item, 
                    ...formData,
                    file: selectedFile || item.file,
                    fileName: selectedFile?.name || item.fileName,
                  } 
                : item
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        const newPending = {
          ...pendingChanges,
          training: {
            ...pendingChanges.training,
            toUpdate: [
              ...pendingChanges.training.toUpdate.filter((p: any) => p.id !== editingItem.id),
              { 
                id: editingItem.id, 
                ...formData,
                file: selectedFile,
                fileName: selectedFile?.name,
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
        training: {
          ...pendingChanges.training,
          toAdd: [
            ...pendingChanges.training.toAdd,
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
        training: {
          ...pendingChanges.training,
          toAdd: pendingChanges.training.toAdd.filter((p: any) => p.tempId !== item.tempId),
        },
      };
      onPendingChangesChange(newPending);
      return;
    }

    if (confirm('Mark this training record for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        training: {
          ...pendingChanges.training,
          toDelete: [
            ...pendingChanges.training.toDelete, 
            { 
              id: item.id, 
              filePath: item.file_path,
              fileName: item.file_name,
            }
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
      training: {
        ...pendingChanges.training,
        toUpdate: pendingChanges.training.toUpdate.filter((p: any) => p.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleUndoDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      training: {
        ...pendingChanges.training,
        toDelete: pendingChanges.training.toDelete.filter((item: any) => item.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleDownload = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('staff-documents')
        .download(filePath);

      if (error) throw error;

      // Create a download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const visibleTraining = [
    ...training.filter(item => !pendingChanges?.training.toDelete.some((d: any) => d.id === item.id)),
    ...(pendingChanges?.training.toAdd || []),
  ];

  const currentStatus = calculateTrainingStatus(formData.expiry_date || null);

  return (
    <>
      <Card className="pb-2.5" id="staff_training">
        <CardHeader>
          <CardTitle>Training</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd}>
            <Plus className="size-4 me-1.5" />
            Add Training
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading training records...</div>
          ) : visibleTraining.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No training records available</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Training Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date Completed</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTraining.map((item) => {
                  const isPendingAdd = 'tempId' in item;
                  const isPendingUpdate = pendingChanges?.training.toUpdate.some((p: any) => p.id === item.id);
                  const isPendingDelete = item.id ? pendingChanges?.training.toDelete.some((d: any) => d.id === item.id) : false;
                  const status = calculateTrainingStatus(item.expiry_date);
                  const hasFile = (item as any).file_path || (item as any).filePath || (item as any).file;

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
                          {hasFile && <FileText className="size-4 text-muted-foreground" />}
                          <div className="flex flex-col">
                            <span className={cn(
                              "font-medium text-gray-900 dark:text-gray-100",
                              isPendingDelete && "line-through"
                            )}>
                              {item.title}
                            </span>
                          </div>
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
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        {item.date_completed ? format(parseISO(item.date_completed), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {item.expiry_date ? format(parseISO(item.expiry_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(status)} size="sm">
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              {hasFile && (item as any).file_path && (
                                <Button variant="ghost" size="sm" onClick={() => handleDownload((item as any).file_path)}>
                                  <Download className="size-4" />
                                </Button>
                              )}
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
                          {isPendingUpdate && item.id && (
                            <Button variant="ghost" size="sm" onClick={() => handleUndoUpdate(item.id!)}>
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && item.id && (
                            <Button variant="ghost" size="sm" onClick={() => handleUndoDelete(item.id!)}>
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
            <DialogTitle>{editingItem ? 'Edit Training' : 'Add Training'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update training record details' : 'Add a new training record'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Training title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Safety, Clinical"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="Training provider"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_completed">Date Completed</Label>
                <Input
                  id="date_completed"
                  type="date"
                  value={formData.date_completed}
                  onChange={(e) => setFormData({ ...formData, date_completed: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center h-10">
                  <Badge variant={getStatusBadgeVariant(currentStatus)} size="sm">
                    {currentStatus}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload Document</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
              {editingItem?.file_name && !selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Current file: {editingItem.file_name}
                </p>
              )}
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
