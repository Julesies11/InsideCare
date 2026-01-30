import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, FileText, Video, Link as LinkIcon, Download, Clock } from 'lucide-react';
import { useStaff, StaffResource } from '@/hooks/useStaff';
import { toast } from 'sonner';
import { PendingChanges } from '@/models/pending-changes';
import { cn } from '@/lib/utils';

interface StaffResourcesSectionProps {
  pendingChanges?: PendingChanges;
  onPendingChangesChange?: (changes: PendingChanges) => void;
}

export function StaffResourcesSection({
  pendingChanges,
  onPendingChangesChange
}: StaffResourcesSectionProps) {
  const [resources, setResources] = useState<StaffResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<StaffResource | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    type: 'Document',
    external_url: '',
    is_popular: false,
    duration: '',
  });

  const { getStaffResources } = useStaff();

  const fetchResources = async () => {
    setLoading(true);
    const { data } = await getStaffResources();
    if (data) setResources(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: '',
      description: '',
      type: 'Document',
      external_url: '',
      is_popular: false,
      duration: '',
    });
    setShowDialog(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description || '',
      type: item.type,
      external_url: item.external_url || '',
      is_popular: item.is_popular || false,
      duration: item.duration || '',
    });
    setShowDialog(true);
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
          staffResources: {
            ...pendingChanges.staffResources,
            toAdd: pendingChanges.staffResources.toAdd.map((item: any) =>
              item.tempId === (editingItem as any).tempId ? { ...item, ...formData } : item
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        const newPending = {
          ...pendingChanges,
          staffResources: {
            ...pendingChanges.staffResources,
            toUpdate: [
              ...pendingChanges.staffResources.toUpdate.filter((p: any) => p.id !== editingItem.id),
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
        staffResources: {
          ...pendingChanges.staffResources,
          toAdd: [
            ...pendingChanges.staffResources.toAdd,
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
        staffResources: {
          ...pendingChanges.staffResources,
          toAdd: pendingChanges.staffResources.toAdd.filter((p: any) => p.tempId !== item.tempId),
        },
      };
      onPendingChangesChange(newPending);
      return;
    }

    if (confirm('Mark this resource for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        staffResources: {
          ...pendingChanges.staffResources,
          toDelete: [...pendingChanges.staffResources.toDelete, item.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleUndoUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      staffResources: {
        ...pendingChanges.staffResources,
        toUpdate: pendingChanges.staffResources.toUpdate.filter((p: any) => p.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleUndoDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      staffResources: {
        ...pendingChanges.staffResources,
        toDelete: pendingChanges.staffResources.toDelete.filter((pId: string) => pId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <Video className="size-4 text-muted-foreground" />;
      case 'link':
        return <LinkIcon className="size-4 text-muted-foreground" />;
      default:
        return <FileText className="size-4 text-muted-foreground" />;
    }
  };

  const visibleResources = [
    ...resources.filter(item => !pendingChanges?.staffResources.toDelete.includes(item.id)),
    ...(pendingChanges?.staffResources.toAdd || []),
  ];

  return (
    <>
      <Card className="pb-2.5" id="staff_resources">
        <CardHeader>
          <CardTitle>Staff Resources & Training</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd}>
            <Plus className="size-4 me-1.5" />
            Add Resource
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Loading resources...</div>
          ) : visibleResources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No resources available</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleResources.map((resource) => {
                  const isPendingAdd = 'tempId' in resource;
                  const isPendingUpdate = pendingChanges?.staffResources.toUpdate.some((p: any) => p.id === resource.id);
                  const isPendingDelete = resource.id ? pendingChanges?.staffResources.toDelete.includes(resource.id) : false;

                  return (
                    <TableRow
                      key={resource.id || (resource as any).tempId}
                      className={
                        isPendingAdd ? 'bg-primary/5' :
                        isPendingDelete ? 'opacity-50 bg-destructive/5' :
                        isPendingUpdate ? 'bg-warning/5' : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getIcon(resource.type)}
                          <div className="flex flex-col">
                            <span className={cn(
                              "font-medium text-gray-900 dark:text-gray-100",
                              isPendingDelete && "line-through"
                            )}>
                              {resource.title}
                            </span>
                            {resource.duration && (
                              <span className="text-[10px] text-muted-foreground">{resource.duration}</span>
                            )}
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
                      <TableCell>{resource.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{resource.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {resource.is_popular && (
                          <Badge variant="primary" size="sm">Popular</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              {resource.external_url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="size-4" />
                                  </a>
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(resource)}>
                                <Edit className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleDelete(resource)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          )}
                          {isPendingUpdate && resource.id && (
                            <Button variant="ghost" size="sm" onClick={() => handleUndoUpdate(resource.id!)}>
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && resource.id && (
                            <Button variant="ghost" size="sm" onClick={() => handleUndoDelete(resource.id!)}>
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
            <DialogTitle>{editingItem ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update resource details' : 'Add a new training resource or document'}
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
                  placeholder="Resource title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Safety, Policy"
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
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (optional)</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 15 mins"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="external_url">URL / Link</Label>
              <Input
                id="external_url"
                value={formData.external_url}
                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_popular"
                checked={formData.is_popular}
                onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
              />
              <Label htmlFor="is_popular">Mark as Popular</Label>
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
