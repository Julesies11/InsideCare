import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Trash2, FileText, Clock, MapPin, Phone, Edit, Upload, X } from 'lucide-react';
import { useHouseResources } from '@/hooks/useHouseResources';
import { cn } from '@/lib/utils';
import { KeenIcon } from '@/components/keenicons';
import { HousePendingChanges } from '@/models/house-pending-changes';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface HouseResourcesProps {
  houseId?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

export function HouseResources({ 
  houseId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: HouseResourcesProps) {
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingResource, setEditingResource] = useState<{ id?: string; tempId?: string; title: string; category: string; type: string; description?: string; priority?: string; phone?: string; address?: string; notes?: string; file_url?: string; file_name?: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    type: '',
    description: '',
    priority: 'Medium',
    phone: '',
    address: '',
    notes: '',
    file: null as File | null,
    fileName: '',
    toDeleteFile: false,
  });

  const { houseResources, loading, getFileUrl } = useHouseResources(houseId);

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
      file: null,
      fileName: '',
      toDeleteFile: false,
    });
    setShowResourceDialog(true);
  };

  const handleEdit = (resource: { id?: string; tempId?: string; title: string; category: string; type: string; description?: string; priority?: string; phone?: string; address?: string; notes?: string; file_url?: string; file_name?: string }) => {
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
      file: null,
      fileName: resource.file_name || '',
      toDeleteFile: false,
    });
    setShowResourceDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file: file,
        fileName: file.name,
        toDeleteFile: false
      }));
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      file: null,
      fileName: '',
      toDeleteFile: !!editingResource?.file_url
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.category.trim() || !formData.type.trim()) {
      return;
    }
    if (!pendingChanges || !onPendingChangesChange) return;

    const resourceData = {
      title: formData.title,
      category: formData.category,
      type: formData.type,
      description: formData.description,
      priority: formData.priority,
      phone: formData.phone,
      address: formData.address,
      notes: formData.notes,
      file: formData.file || undefined,
      file_url: formData.file ? undefined : (formData.toDeleteFile ? null : editingResource?.file_url),
      file_name: formData.file ? formData.file.name : (formData.toDeleteFile ? undefined : formData.fileName),
      file_size: formData.file ? formData.file.size : undefined,
      toDeleteFile: formData.toDeleteFile,
      house_id: houseId,
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
              { id: editingResource.id!, ...resourceData },
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

  const handleDelete = (resource: { id: string; tempId?: string; file_url?: string }) => {
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
          toDelete: [...pendingChanges.resources.toDelete, { id: resource.id, filePath: resource.file_url }],
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
        toDelete: pendingChanges.resources.toDelete.filter(resource => resource.id !== id),
      },
    };
    onPendingChangesChange(newPending);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getFileUrl(filePath, fileName);
    if (url) window.open(url, '_blank');
  };

  // Filter out resources marked for deletion
  const visibleResources = [
    ...houseResources.filter(resource => !pendingChanges?.resources.toDelete.some(r => r.id === resource.id)),
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
            <div className="overflow-x-auto"><Table>
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
                  const isPendingDelete = pendingChanges?.resources.toDelete.some(r => r.id === resource.id);
                  const currentFile = isPendingAdd ? resource.file : null;
                  const fileName = currentFile ? currentFile.name : resource.file_name;
                  const fileSize = currentFile ? currentFile.size : resource.file_size;

                  return (
                    <ContextMenu key={resource.id || resource.tempId}>
                      <ContextMenuTrigger asChild>
                        <TableRow 
                          className={cn(
                            "cursor-context-menu",
                            isPendingAdd ? 'bg-primary/5' : 
                            isPendingDelete ? 'opacity-50 bg-destructive/5' : 
                            isPendingUpdate ? 'bg-warning/5' : ''
                          )}
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
                              {fileName ? (
                                <div 
                                  className="flex items-center gap-2 cursor-pointer select-none"
                                  onDoubleClick={() => resource.file_url && handleDownload(resource.file_url, resource.file_name || 'resource')}
                                  title="Double-click to download"
                                >
                                  <FileText className="size-4 text-muted-foreground" />
                                  <div>
                                    <div className="line-clamp-1">{fileName}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatFileSize(fileSize)}
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
                                      onClick={() => handleDownload(resource.file_url!, resource.file_name || 'resource')}
                                    >
                                      <Download className="size-4" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(resource)} disabled={!canAdd}>
                                   <Edit className="size-4" />
                                  </Button>                              {canDelete && (
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
                      </ContextMenuTrigger>
                      
                      <ContextMenuContent className="w-48">
                        {resource.file_url && (
                          <ContextMenuItem onClick={() => handleDownload(resource.file_url!, resource.file_name || 'resource')}>
                            <KeenIcon icon="cloud-download" className="me-2" />
                            Download File
                          </ContextMenuItem>
                        )}
                        <ContextMenuItem onClick={() => handleEdit(resource)} disabled={!canAdd}>
                          <KeenIcon icon="pencil" className="me-2" />
                          Edit Resource
                        </ContextMenuItem>
                        
                        {canDelete && !isPendingDelete && (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuItem 
                              variant="destructive"
                              onClick={() => handleDelete(resource)}
                            >
                              <KeenIcon icon="trash" className="me-2" />
                              Delete
                            </ContextMenuItem>
                          </>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </TableBody>
            </Table></div>
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

            <div className="space-y-2">
              <Label>Attachment</Label>
              <div className="flex flex-col gap-2">
                {formData.fileName ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="size-5 text-muted-foreground shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate">{formData.fileName}</span>
                        {formData.file && (
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(formData.file.size)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={handleRemoveFile}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-8 text-muted-foreground mb-2" />
                    <span className="text-sm font-medium">Click to upload or drag and drop</span>
                    <span className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, JPG, PNG up to 10MB</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
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
