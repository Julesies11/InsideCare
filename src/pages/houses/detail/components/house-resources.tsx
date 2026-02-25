import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Trash2, FileText, Clock, MapPin, Phone, ExternalLink, Edit } from 'lucide-react';
import { useHouseResources } from '@/hooks/useHouseResources';
import { useAuth } from '@/auth/context/auth-context';
import { HousePendingChanges } from '@/models/house-pending-changes';

interface HouseResourcesProps {
  houseId?: string;
  houseName?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

export function HouseResources({ 
  houseId, 
  houseName, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: HouseResourcesProps) {
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    type: '',
    description: '',
    priority: 'Medium',
    phone: '',
    address: '',
    notes: '',
  });

  const { houseResources, loading, getFileUrl } = useHouseResources(houseId);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAdd = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      category: '',
      type: '',
      description: '',
      priority: 'Medium',
      phone: '',
      address: '',
      notes: '',
    });
    setShowResourceDialog(true);
  };

  const handleEdit = (resource: any) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      category: resource.category,
      type: resource.type,
      description: resource.description || '',
      priority: resource.priority || 'Medium',
      phone: resource.phone || '',
      address: resource.address || '',
      notes: resource.notes || '',
    });
    setShowResourceDialog(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.category.trim() || !formData.type.trim()) {
      return;
    }
    if (!pendingChanges || !onPendingChangesChange) return;

    const resourceData = {
      ...formData,
      house_id: houseId,
      created_by: user?.id,
    };

    if (editingResource) {
      // Update existing resource
      if (editingResource.tempId) {
        // Update pending add
        const newPending = {
          ...pendingChanges,
          resources: {
            ...pendingChanges.resources,
            toAdd: pendingChanges.resources.toAdd.map(resource =>
              resource.tempId === editingResource.tempId ? { ...resource, ...resourceData } : resource
            ),
          },
        };
        onPendingChangesChange(newPending);
      } else {
        // Add to pending updates
        const newPending = {
          ...pendingChanges,
          resources: {
            ...pendingChanges.resources,
            toUpdate: [
              ...pendingChanges.resources.toUpdate.filter(r => r.id !== editingResource.id),
              { id: editingResource.id, ...resourceData },
            ],
          },
        };
        onPendingChangesChange(newPending);
      }
    } else {
      // Add new resource
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const newPending = {
        ...pendingChanges,
        resources: {
          ...pendingChanges.resources,
          toAdd: [
            ...pendingChanges.resources.toAdd,
            { tempId, ...resourceData },
          ],
        },
      };
      onPendingChangesChange(newPending);
    }
    setShowResourceDialog(false);
  };

  const handleDelete = (resource: any) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    // If it's a pending add, just remove it from the pending adds list
    if (resource.tempId) {
      handleCancelPendingAdd(resource.tempId);
      return;
    }

    // Otherwise, mark existing resource for deletion
    if (confirm('Mark this resource for deletion? It will be removed when you click Save Changes.')) {
      const newPending = {
        ...pendingChanges,
        resources: {
          ...pendingChanges.resources,
          toDelete: [...pendingChanges.resources.toDelete, resource.id],
        },
      };
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingAdd = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      resources: {
        ...pendingChanges.resources,
        toAdd: pendingChanges.resources.toAdd.filter(resource => resource.tempId !== tempId),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingUpdate = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      resources: {
        ...pendingChanges.resources,
        toUpdate: pendingChanges.resources.toUpdate.filter(resource => resource.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;

    const newPending = {
      ...pendingChanges,
      resources: {
        ...pendingChanges.resources,
        toDelete: pendingChanges.resources.toDelete.filter(resourceId => resourceId !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  // Filter out resources marked for deletion
  const visibleResources = [
    ...houseResources.filter(resource => !pendingChanges?.resources.toDelete.includes(resource.id)),
    ...(pendingChanges?.resources.toAdd || []),
  ];

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'red';
      case 'Medium': return 'yellow';
      case 'Low': return 'green';
      default: return 'gray';
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Emergency': return 'red';
      case 'Medical': return 'blue';
      case 'Legal': return 'purple';
      case 'Financial': return 'green';
      case 'Educational': return 'orange';
      case 'Maintenance': return 'yellow';
      case 'Other': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <>
      <Card className="pb-2.5" id="resources">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Resources
          </CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={handleAdd} disabled={!houseId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Add Resource
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading resources...</div>
          ) : visibleResources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <FileText className="size-12 text-muted-foreground opacity-50" />
                <p>No resources added yet</p>
                <p className="text-sm">Add important resources, contacts, and information for this house</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleResources.map((resource) => {
                  const isPendingAdd = 'tempId' in resource;
                  const isPendingUpdate = pendingChanges?.resources.toUpdate.some(r => r.id === resource.id);
                  const isPendingDelete = pendingChanges?.resources.toDelete.includes(resource.id);
                  
                  return (
                    <TableRow 
                      key={resource.id || resource.tempId} 
                      className={
                        isPendingAdd ? 'bg-primary/5' : 
                        isPendingDelete ? 'opacity-50 bg-destructive/5' : 
                        isPendingUpdate ? 'bg-warning/5' : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <div className={`flex flex-col ${isPendingDelete ? 'line-through' : ''}`}>
                            <span className="font-medium">{resource.title}</span>
                            {resource.description && (
                              <span className="text-xs text-muted-foreground line-clamp-2">
                                {resource.description}
                              </span>
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
                        <Badge variant="outline" className={`text-xs border-${getCategoryColor(resource.category)}-500 text-${getCategoryColor(resource.category)}-700`}>
                          {resource.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{resource.type}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs border-${getPriorityColor(resource.priority)}-500 text-${getPriorityColor(resource.priority)}-700`}>
                          {resource.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {resource.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="size-4 text-muted-foreground" />
                              <span>{resource.phone}</span>
                            </div>
                          )}
                          {resource.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="size-4 text-muted-foreground" />
                              <span className="line-clamp-2">{resource.address}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {resource.file_name ? (
                            <div className="flex items-center gap-2">
                              <FileText className="size-4 text-muted-foreground" />
                              <div>
                                <div className="line-clamp-1">{resource.file_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatFileSize(resource.file_size)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No file</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              {resource.file_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(resource.file_url, '_blank')}
                                >
                                  <Download className="size-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(resource)}>
                                <Edit className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(resource)}
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
                              onClick={() => handleCancelPendingAdd(resource.tempId!)}
                            >
                              Remove
                            </Button>
                          )}
                          {isPendingUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingUpdate(resource.id)}
                            >
                              Undo
                            </Button>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(resource.id)}
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

      <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
            <DialogDescription>
              {editingResource
                ? 'Update resource details'
                : 'Add a new resource for this house'}
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
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Financial">Financial</SelectItem>
                    <SelectItem value="Educational">Educational</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  placeholder="Resource type"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this resource"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Contact phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Physical address"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResourceDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
