import { useRef, useState } from 'react';
import { HousePendingChanges } from '@/models/house-pending-changes';
import {
  Clock,
  FileText,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useHouseResources } from '@/hooks/useHouseResources';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface HouseResourcesProps {
  houseId?: string;
  canAdd: boolean;
  pendingChanges?: HousePendingChanges;
  onPendingChangesChange?: (changes: HousePendingChanges) => void;
}

interface ResourceItem {
  id?: string;
  tempId?: string;
  title: string;
  category: string;
  type: string;
  description?: string;
  priority?: string;
  phone?: string;
  address?: string;
  notes?: string;
  file_url?: string;
  file_name?: string;
  is_active?: boolean;
}

const getFileIcon = (fileName?: string) => {
  if (!fileName) return 'doc.svg';
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'pdf.svg';
    case 'doc':
    case 'docx':
      return 'word.svg';
    case 'xls':
    case 'xlsx':
      return 'excel.svg';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'svg':
    case 'webp':
      return 'image.svg';
    case 'txt':
      return 'text.svg';
    case 'zip':
    case 'rar':
    case '7z':
      return 'zip.svg';
    default:
      return 'doc.svg';
  }
};

export function HouseResources({
  houseId,
  canAdd,
  pendingChanges,
  onPendingChangesChange,
}: HouseResourcesProps) {
  const [showResourceDialog, setShowResourceDialog] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(
    null,
  );
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
    is_active: true,
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
      is_active: true,
    });
    setShowResourceDialog(true);
  };

  const handleEdit = (resource: ResourceItem) => {
    const pendingUpdate = resource.id
      ? pendingChanges?.resources.toUpdate.find((r) => r.id === resource.id)
      : null;
    const mergedResource = { ...resource, ...pendingUpdate };

    setEditingResource(mergedResource);
    setFormData({
      title: mergedResource.title,
      category: mergedResource.category,
      type: mergedResource.type,
      description: mergedResource.description || '',
      priority: mergedResource.priority || 'Medium',
      phone: mergedResource.phone || '',
      address: mergedResource.address || '',
      notes: mergedResource.notes || '',
      file: null,
      fileName: mergedResource.file_name || '',
      toDeleteFile: false,
      is_active: mergedResource.is_active ?? true,
    });
    setShowResourceDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        file: file,
        fileName: file.name,
        toDeleteFile: false,
      }));
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      file: null,
      fileName: '',
      toDeleteFile: !!editingResource?.file_url,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (
      !formData.title.trim() ||
      !formData.category.trim() ||
      !formData.type.trim()
    ) {
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
      file_url: formData.file
        ? undefined
        : formData.toDeleteFile
          ? null
          : editingResource?.file_url,
      file_name: formData.file
        ? formData.file.name
        : formData.toDeleteFile
          ? null
          : formData.fileName,
      file_size: formData.file
        ? formData.file.size
        : formData.toDeleteFile
          ? null
          : undefined,
      toDeleteFile: formData.toDeleteFile,
      oldFilePath: formData.toDeleteFile ? editingResource?.file_url : undefined,
      is_active: formData.is_active,
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
            toAdd: pendingChanges.resources.toAdd.map((resource) =>
              resource.tempId === editingResource.tempId
                ? { ...resource, ...resourceData }
                : resource,
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
              ...pendingChanges.resources.toUpdate.filter(
                (r) => r.id !== editingResource.id,
              ),
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
    toast.info('Resource pending save');
  };

  const handleView = async (filePath: string) => {
    const url = await getFileUrl(filePath, false);
    if (url) window.open(url, '_blank');
  };

  // Filter out resources marked for deletion
  const visibleResources = [
    ...houseResources.filter((resource) => {
      const isDeleted = pendingChanges?.resources.toDelete.some(
        (r) => r.id === resource.id,
      );
      if (isDeleted) return false;

      const isPendingUpdate = pendingChanges?.resources.toUpdate.find(
        (r) => r.id === resource.id,
      );
      const isActive =
        isPendingUpdate?.is_active !== undefined
          ? isPendingUpdate.is_active
          : resource.is_active;

      if (showOnlyActive && !isActive) return false;
      return true;
    }),
    ...(pendingChanges?.resources.toAdd || []).filter((resource) => {
      if (showOnlyActive && !resource.is_active) return false;
      return true;
    }),
  ];

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'red';
      case 'Medium':
        return 'yellow';
      case 'Low':
        return 'green';
      default:
        return 'gray';
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Emergency':
        return 'red';
      case 'Medical':
        return 'blue';
      case 'Legal':
        return 'purple';
      case 'Financial':
        return 'green';
      case 'Educational':
        return 'orange';
      case 'Maintenance':
        return 'yellow';
      case 'Other':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return (
    <>
      <Card className="pb-2.5" id="resources">
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Resources
            </CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Switch
                id="show-only-active-resources"
                checked={showOnlyActive}
                onCheckedChange={setShowOnlyActive}
              />
              <Label
                htmlFor="show-only-active-resources"
                className="text-xs font-bold cursor-pointer"
              >
                Active Only
              </Label>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="border border-gray-300"
              onClick={handleAdd}
              disabled={!houseId || !canAdd}
            >
              <Plus className="size-4 me-1.5" />
              Add Resource
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading resources...
            </div>
          ) : visibleResources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <FileText className="size-12 text-muted-foreground opacity-50" />
                <p>No resources added yet</p>
                <p className="text-sm">
                  Add important resources, contacts, and information for this
                  house
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleResources.map((resource) => {
                    const isPendingAdd = 'tempId' in resource;
                    const isPendingUpdate =
                      pendingChanges?.resources.toUpdate.some(
                        (r) => r.id === resource.id,
                      );
                    const isPendingDelete =
                      pendingChanges?.resources.toDelete.some(
                        (r) => r.id === resource.id,
                      );

                    const pendingUpdate =
                      pendingChanges?.resources.toUpdate.find(
                        (r) => r.id === resource.id,
                      );
                    const mergedResource = isPendingUpdate
                      ? { ...resource, ...pendingUpdate }
                      : resource;
                    const isActive = mergedResource.is_active !== false;

                    const currentFile = isPendingAdd
                      ? mergedResource.file
                      : null;
                    const fileName = currentFile
                      ? currentFile.name
                      : mergedResource.file_name;
                    const fileSize = currentFile
                      ? currentFile.size
                      : mergedResource.file_size;

                    return (
                      <TableRow
                        key={mergedResource.id || mergedResource.tempId}
                        className={cn(
                          'cursor-default',
                          isPendingAdd
                            ? 'bg-primary/5'
                            : isPendingDelete
                              ? 'opacity-50 bg-destructive/5'
                              : isPendingUpdate
                                ? 'bg-warning/5'
                                : '',
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex flex-col ${isPendingDelete ? 'line-through' : ''}`}
                            >
                              <button
                                onClick={() => handleEdit(mergedResource)}
                                className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline text-left cursor-pointer"
                              >
                                {mergedResource.title}
                              </button>
                              {mergedResource.description && (
                                <span className="text-xs text-muted-foreground line-clamp-2">
                                  {mergedResource.description}
                                </span>
                              )}
                            </div>
                            {isPendingAdd && (
                              <span className="text-xs text-primary flex items-center gap-1">
                                <Clock className="size-3" />
                                Pending save
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
                          <Badge
                            variant="outline"
                            className={`text-xs border-${getCategoryColor(mergedResource.category)}-500 text-${getCategoryColor(mergedResource.category)}-700`}
                          >
                            {mergedResource.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {fileName ? (
                              <button
                                type="button"
                                className="flex items-center gap-2 cursor-pointer select-none group"
                                onClick={() =>
                                  mergedResource.file_url &&
                                  handleView(mergedResource.file_url)
                                }
                                title="Click to view"
                              >
                                <img
                                  src={toAbsoluteUrl(
                                    `/media/file-types/${getFileIcon(fileName)}`,
                                  )}
                                  className="size-6 shrink-0 transition-opacity group-hover:opacity-80"
                                  alt="file icon"
                                />
                                <div>
                                  <div className="line-clamp-1 text-muted-foreground group-hover:text-primary group-hover:underline transition-colors text-[10px]">
                                    {fileName}
                                  </div>
                                  <div className="text-[9px] text-muted-foreground text-left">
                                    {formatFileSize(fileSize)}
                                  </div>
                                </div>
                              </button>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">
                                No attachment
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isActive ? 'outline' : 'secondary'}
                            className={cn(
                              'text-[10px] uppercase font-bold',
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200',
                            )}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showResourceDialog} onOpenChange={setShowResourceDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? 'Edit Resource' : 'Add Resource'}
            </DialogTitle>
            <DialogDescription>
              {editingResource
                ? 'Update resource details'
                : 'Add a new resource for this house'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Resource title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
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
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  placeholder="Resource type"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe this resource"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
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
                      <img
                        src={toAbsoluteUrl(
                          `/media/file-types/${getFileIcon(formData.fileName)}`,
                        )}
                        className="size-8 shrink-0"
                        alt="file icon"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate">
                          {formData.fileName}
                        </span>
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
                      title="Remove attachment"
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
                    <span className="text-sm font-medium">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, JPG, PNG up to 10MB
                    </span>
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

            <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50">
              <div className="flex flex-col gap-1">
                <Label htmlFor="resource-status" className="text-sm font-bold">
                  Resource Status
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inactive resources are hidden by default
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-tight',
                    formData.is_active ? 'text-emerald-600' : 'text-gray-400',
                  )}
                >
                  {formData.is_active ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  id="resource-status"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResourceDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editingResource ? 'Update Resource' : 'Save Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
