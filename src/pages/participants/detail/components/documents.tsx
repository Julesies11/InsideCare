import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardToolbar } from '@/components/ui/card';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, CloudUpload, TriangleAlert, Trash2, X, Shield, Info, LayoutGrid, List } from 'lucide-react';
import { useParticipantDocuments, getParticipantFileUrl as getFileUrl, useUpdateParticipantDocument, ParticipantDocument } from '@/hooks/use-participant-documents';
import { useRoles } from '@/hooks/use-roles';
import { useDocumentRolePermissions, useUpdateDocumentRolePermissions, useAllParticipantDocumentOverrides } from '@/hooks/use-document-role-permissions';
import { useAllRolePermissions } from '@/hooks/use-role-permissions';
import { KeenIcon } from '@/components/keenicons';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useFileUpload, formatBytes } from '@/hooks/use-file-upload';
import { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserPlus, UserMinus, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRBAC, AccessLevel, ACCESS_LEVEL } from '@/hooks/useRBAC';
import { RBAC_MODULES } from '@/config/rbac-modules';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Label } from '@/components/ui/label';

interface DocumentPendingChanges {
  toAdd: any[];
  toDelete: any[];
}

interface DocumentsProps {
  participantId?: string;
  participantName?: string;
  canAdd: boolean;
  canDelete: boolean;
  canEdit: boolean;
  pendingChanges?: DocumentPendingChanges;
  onPendingChangesChange?: (changes: DocumentPendingChanges) => void;
}

const getFileIcon = (fileName: string) => {
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

export function Documents({ 
  participantId, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: DocumentsProps) {
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ParticipantDocument | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Access state for the dialog
  const [searchTerm, setSearchTerm] = useState('');
  const [overrides, setOverrides] = useState<Record<string, AccessLevel>>({});

  const { data: documents = [], isLoading: loading } = useParticipantDocuments(participantId);
  const documentIds = useMemo(() => documents.map(d => d.id), [documents]);
  const { data: allOverrides = [] } = useAllParticipantDocumentOverrides(documentIds);
  const updateDoc = useUpdateParticipantDocument();
  const { roles: allRoles } = useRoles();
  const { data: globalPermissions = [] } = useAllRolePermissions();
  const { data: existingOverrides, isLoading: permissionsLoading } = useDocumentRolePermissions(selectedDoc?.id);
  const updatePermissions = useUpdateDocumentRolePermissions();
  const { isAdmin, hasAccess } = useRBAC();

  const isAccessAdmin = isAdmin || hasAccess({
    resource: RBAC_MODULES.PARTICIPANT_DOCUMENTS,
    requiredLevel: ACCESS_LEVEL.FULL
  });

  // Sync overrides when existingPermissions data is fetched/changed
  useEffect(() => {
    if (accessDialogOpen && existingOverrides) {
      const initialOverrides: Record<string, AccessLevel> = {};
      existingOverrides.forEach((p: any) => {
        initialOverrides[p.role_id] = p.access_level as AccessLevel;
      });
      setOverrides(initialOverrides);
    }
  }, [existingOverrides, accessDialogOpen]);

  const handleOpenAccessDialog = (doc: ParticipantDocument) => {
    setSelectedDoc(doc);
    setOverrides({}); // Clear until query fetches fresh data
    setAccessDialogOpen(true);
  };

  const handleUpdateAccess = async () => {
    if (!selectedDoc || !participantId) return;

    try {
      // Update the role-based permissions (overrides)
      const roleUpdates = Object.entries(overrides).map(([role_id, access_level]) => ({
        role_id,
        access_level,
      }));

      await updatePermissions.mutateAsync({
        documentId: selectedDoc.id,
        roles: roleUpdates,
      });

      toast.success('Document access overrides updated successfully');
      setAccessDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to update access: ${error.message}`);
    }
  };

  const getInheritedLevel = (roleId: string): AccessLevel => {
    const rolePerms = globalPermissions.find(p => p.role_id === roleId);
    if (!rolePerms) return ACCESS_LEVEL.NONE;
    if ((rolePerms as any).access_control === ACCESS_LEVEL.FULL) return ACCESS_LEVEL.FULL;
    return (rolePerms as any).participant_documents || ACCESS_LEVEL.NONE;
  };

  const getEffectiveLevel = (roleId: string): AccessLevel => {
    if (overrides[roleId]) return overrides[roleId];
    return getInheritedLevel(roleId);
  };

  const setOverride = (roleId: string, level: AccessLevel | 'inherit') => {
    setOverrides(prev => {
      const next = { ...prev };
      if (level === 'inherit') {
        delete next[roleId];
      } else {
        next[roleId] = level;
      }
      return next;
    });
  };

  const ACCESS_OPTIONS = [
    { value: 'inherit', label: 'Inherit Role Permissions' },
    { value: ACCESS_LEVEL.FULL, label: 'Edit' },
    { value: ACCESS_LEVEL.CONTEXT_READ_ONLY, label: 'Read-only' },
    { value: ACCESS_LEVEL.NONE, label: 'No Access' },
  ];

  const relevantRoles = allRoles.filter(r => r.is_active || overrides[r.id]);
  const filteredRoles = relevantRoles.filter(r => 
    r.role_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasAnyOverrides = (docId: string) => {
    return allOverrides.some(o => o.document_id === docId);
  };

  const [
    { isDragging, errors, files: uploadQueue },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt,.zip',
    multiple: true,
  });

  const handleAddToUploadQueue = () => {
    if (!uploadQueue.length || !pendingChanges || !onPendingChangesChange) return;
    
    const newPendingToAdd = uploadQueue.map(fileWithPreview => ({
      file: fileWithPreview.file as File,
      fileName: fileWithPreview.file.name,
      tempId: fileWithPreview.id,
    }));

    const newPending = {
      ...pendingChanges,
      toAdd: [
        ...pendingChanges.toAdd,
        ...newPendingToAdd,
      ],
    };
    
    onPendingChangesChange(newPending);
    setShowUploadSheet(false);
    clearFiles();
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getFileUrl(filePath, fileName);
    if (url) window.open(url, '_blank');
  };

  const handleDelete = (id: string, filePath: string, fileName: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    
    if (confirm(`Mark document "${fileName}" for deletion? It will be removed when you click Save Changes.`)) {
      // Add to pending deletes instead of immediate delete
      const newPending = {
        ...pendingChanges,
        toDelete: [
          ...pendingChanges.toDelete,
          { id, filePath, fileName },
        ],
      };
      
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingUpload = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    
    const newPending = {
      ...pendingChanges,
      toAdd: pendingChanges.toAdd.filter(doc => doc.tempId !== tempId),
    };
    
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    
    const newPending = {
      ...pendingChanges,
      toDelete: pendingChanges.toDelete.filter(doc => doc.id !== id),
    };
    
    onPendingChangesChange(newPending);
  };

  // Filter out documents marked for deletion
  const visibleDocuments = documents.filter(
    doc => !pendingChanges?.toDelete?.some(pending => pending.id === doc.id)
  );

  return (
    <>
      <Card className="pb-2.5" id="documents">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardToolbar className="gap-2">
            {isAccessAdmin && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1 me-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("size-8 rounded-md", viewMode === 'grid' ? "bg-white shadow-sm text-primary" : "text-gray-500")}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("size-8 rounded-md", viewMode === 'table' ? "bg-white shadow-sm text-primary" : "text-gray-500")}
                  onClick={() => setViewMode('table')}
                  title="Table View (Admin Only)"
                >
                  <List className="size-4" />
                </Button>
              </div>
            )}
            <Button variant="secondary" size="sm" className="border border-gray-300" onClick={() => setShowUploadSheet(true)} disabled={!participantId || !canAdd}>
              <Plus className="size-4 me-1.5" />
              Upload Document
            </Button>
          </CardToolbar>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
          ) : visibleDocuments.length === 0 && (!pendingChanges?.toAdd?.length) ? (
            <div className="text-center py-12 bg-gray-50/50 border border-dashed rounded-xl">
              <KeenIcon icon="files" className="text-4xl text-gray-300 mb-3" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {/* Existing documents */}
              {visibleDocuments.map((doc) => {
                const isPendingDelete = pendingChanges?.toDelete?.some(pending => pending.id === doc.id);
                const hasOverrides = hasAnyOverrides(doc.id);
                return (
                  <ContextMenu key={doc.id}>
                    <ContextMenuTrigger asChild>
                      <div 
                        className={cn(
                          "flex flex-col items-center justify-start p-1.5 rounded-lg hover:bg-gray-50 transition-all relative group text-center w-full min-h-[85px] cursor-context-menu",
                          isPendingDelete && "opacity-60 grayscale bg-destructive/5",
                          hasOverrides && "bg-amber-50/30 border border-amber-100/50 shadow-xs"
                        )}
                      >
                        <div className="size-10 flex items-center justify-center shrink-0 mb-1 group-hover:scale-110 transition-transform relative">
                          <img 
                            src={toAbsoluteUrl(`/media/file-types/${getFileIcon(doc.file_name)}`)} 
                            className="size-8" 
                            alt="file icon" 
                          />
                          {hasOverrides && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm border border-white">
                              <Shield className="size-2.5" />
                            </div>
                          )}
                        </div>
                        
                        <span className={cn(
                          "text-[10px] font-normal text-gray-800 break-words w-full px-0.5 leading-[1.1] line-clamp-3",
                          isPendingDelete && "line-through",
                          hasOverrides && "text-amber-900 font-medium"
                        )} title={doc.file_name}>
                          {doc.file_name}
                        </span>

                        <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          {!isPendingDelete ? (
                            <>
                              <button
                                type="button"
                                className="size-5 rounded-full shadow-sm bg-white border border-gray-200 text-gray-500 hover:text-primary flex items-center justify-center transition-colors"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDownload(doc.file_path, doc.file_name);
                                }}
                                title="Download"
                              >
                                <KeenIcon icon="cloud-download" className="!text-[9px]" />
                              </button>
                              {canDelete && (
                                <button
                                  type="button"
                                  className="size-5 rounded-full shadow-sm bg-white border border-gray-200 text-gray-500 hover:text-destructive flex items-center justify-center transition-colors"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(doc.id, doc.file_path, doc.file_name);
                                  }}
                                  title="Delete"
                                >
                                  <KeenIcon icon="trash" className="!text-[9px]" />
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              className="h-5 px-1.5 rounded-full shadow-sm bg-white border border-gray-100 text-[8px] font-bold uppercase text-primary transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCancelPendingDelete(doc.id);
                              }}
                            >
                              Undo
                            </button>
                          )}
                        </div>

                        {isPendingDelete && (
                          <div className="mt-auto pt-1 flex justify-center">
                            <span className="text-[7px] font-bold text-destructive uppercase tracking-tighter bg-white px-1 py-0.5 rounded-full border border-destructive/10 shadow-xs">
                              Deleting
                            </span>
                          </div>
                        )}
                      </div>
                    </ContextMenuTrigger>
                    
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => handleDownload(doc.file_path, doc.file_name)}>
                        <KeenIcon icon="cloud-download" className="me-2" />
                        Download
                      </ContextMenuItem>
                      <ContextMenuItem disabled>
                        <KeenIcon icon="pencil" className="me-2" />
                        Rename
                      </ContextMenuItem>
                      
                      {isAccessAdmin && (
                        <>
                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={() => handleOpenAccessDialog(doc)}>
                            <Shield className="size-4 me-2 text-primary" />
                            Assign Access
                          </ContextMenuItem>
                        </>
                      )}
                      
                      {canDelete && !isPendingDelete && (
                        <>
                          <ContextMenuSeparator />
                          <ContextMenuItem 
                            variant="destructive"
                            onClick={() => handleDelete(doc.id, doc.file_path, doc.file_name)}
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
              
              {/* Pending uploads */}
              {pendingChanges?.toAdd?.map((pending) => (
                <div 
                  key={pending.tempId} 
                  className="flex flex-col items-center justify-start p-1.5 rounded-lg bg-primary/[0.03] hover:bg-primary/[0.08] transition-all relative group text-center w-full min-h-[85px]"
                >
                  <div className="size-10 flex items-center justify-center shrink-0 mb-1 group-hover:scale-110 transition-transform">
                    <img 
                      src={toAbsoluteUrl(`/media/file-types/${getFileIcon(pending.fileName)}`)} 
                      className="size-8" 
                      alt="file icon" 
                    />
                  </div>
                  
                  <span className="text-[10px] font-normal text-primary break-words w-full px-0.5 leading-[1.1] line-clamp-3" title={pending.fileName}>
                    {pending.fileName}
                  </span>

                  <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                      type="button"
                      className="size-5 rounded-full shadow-sm bg-white border border-primary/10 text-primary hover:bg-primary/5 flex items-center justify-center transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCancelPendingUpload(pending.tempId);
                      }}
                    >
                      <KeenIcon icon="cross" className="!text-[9px]" />
                    </button>
                  </div>

                  <div className="mt-auto pt-1 flex justify-center">
                    <span className="text-[7px] font-bold text-primary uppercase tracking-tighter bg-white px-1 py-0.5 rounded-full border border-primary/10 shadow-xs animate-pulse">
                      Pending Save
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View (Admin Only) */
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-[300px]">Document Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded On</TableHead>
                    <TableHead className="w-[250px]">Access Control</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleDocuments.map((doc) => {
                    const isPendingDelete = pendingChanges?.toDelete?.some(pending => pending.id === doc.id);
                    return (
                      <TableRow key={doc.id} className={cn(isPendingDelete && "opacity-50 grayscale bg-destructive/5")}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={toAbsoluteUrl(`/media/file-types/${getFileIcon(doc.file_name)}`)} 
                              className="size-8" 
                              alt="file icon" 
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-gray-900 truncate">
                                {doc.file_name}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {doc.mime_type || 'Unknown Type'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-gray-500">
                          {doc.file_size ? formatBytes(doc.file_size) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-gray-500">
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="py-3 align-top">
                          <div className="flex flex-col gap-1.5 min-w-[200px]">
                            {allRoles.filter(r => r.is_active || allOverrides.some(o => o.document_id === doc.id && o.role_id === r.id)).map((role) => {
                              const override = allOverrides.find(o => o.document_id === doc.id && o.role_id === role.id);
                              const inheritedLevel = getInheritedLevel(role.id);
                              const effectiveLevel = override ? (override.access_level as AccessLevel) : inheritedLevel;
                              const isOverride = !!override;
                              
                              return (
                                <div key={role.id} className="flex items-center justify-between gap-4">
                                  <span className={cn(
                                    "text-[10px] truncate max-w-[130px]",
                                    isOverride ? "font-bold text-amber-700" : "font-medium text-gray-500",
                                    !role.is_active && "line-through opacity-70"
                                  )}>
                                    {role.role_name} {!role.is_active && "(Inactive)"}
                                  </span>
                                  <Badge 
                                    variant={isOverride ? "default" : "outline"}
                                    className={cn(
                                      "text-[9px] py-0 px-1.5 h-4 border-none font-bold uppercase tracking-tight shrink-0",
                                      isOverride ? (
                                        effectiveLevel === ACCESS_LEVEL.NONE ? "bg-red-500 text-white" : 
                                        effectiveLevel === ACCESS_LEVEL.FULL ? "bg-emerald-500 text-white" : 
                                        "bg-amber-500 text-white"
                                      ) : (
                                        effectiveLevel === ACCESS_LEVEL.NONE ? "bg-gray-100 text-gray-400" : 
                                        effectiveLevel === ACCESS_LEVEL.FULL ? "bg-emerald-50 text-emerald-700 border-emerald-200 border" : 
                                        "bg-amber-50 text-amber-700 border-amber-200 border"
                                      )
                                    )}
                                  >
                                    {effectiveLevel === ACCESS_LEVEL.NONE ? 'None' : effectiveLevel === ACCESS_LEVEL.FULL ? 'Edit' : 'Read-only'}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-gray-400 hover:text-primary"
                              onClick={() => handleDownload(doc.file_path, doc.file_name)}
                            >
                              <KeenIcon icon="cloud-download" className="!text-sm" />
                            </Button>
                            {isAccessAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-gray-400 hover:text-primary"
                                onClick={() => handleOpenAccessDialog(doc)}
                              >
                                <Shield className="size-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-gray-400 hover:text-destructive"
                                onClick={() => handleDelete(doc.id, doc.file_path, doc.file_name)}
                              >
                                <KeenIcon icon="trash" className="!text-sm" />
                              </Button>
                            )}
                          </div>
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

      <Sheet open={showUploadSheet} onOpenChange={(open) => {
        setShowUploadSheet(open);
        if (!open) clearFiles();
      }}>
        <SheetContent className="sm:max-w-[500px] flex flex-col h-full">
          <SheetHeader className="shrink-0">
            <SheetTitle>Upload Documents</SheetTitle>
            <SheetDescription>
              Drag and drop files here or click to browse. Multiple files supported.
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="flex-1 overflow-y-auto space-y-6 py-6 -mx-6 px-6">
            {/* Drag & Drop Zone */}
            <div
              className={cn(
                'relative rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer group',
                isDragging 
                  ? 'border-primary bg-primary/5 shadow-inner scale-[0.99]' 
                  : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50/50',
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input {...getInputProps()} className="sr-only" />

              <div className="flex flex-col items-center gap-4">
                <div
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-primary/10',
                    isDragging && 'bg-primary/20 scale-110',
                  )}
                >
                  <CloudUpload className={cn(
                    "h-8 w-8 text-gray-400 transition-colors group-hover:text-primary",
                    isDragging && "text-primary"
                  )} />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">
                    Drop files here or <span className="text-primary hover:underline">browse files</span>
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    PDF, Word, Excel, Images, Zip (Max 10MB per file)
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Queue */}
            {uploadQueue.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                    Upload Queue ({uploadQueue.length})
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs font-semibold text-destructive hover:bg-destructive/5"
                    onClick={clearFiles}
                  >
                    <Trash2 className="size-3.5 me-1" />
                    Clear All
                  </Button>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                  {uploadQueue.map((fileItem) => (
                    <div key={fileItem.id} className="flex items-center gap-3 p-3 bg-white hover:bg-gray-50 transition-colors group">
                      <div className="size-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <img 
                          src={toAbsoluteUrl(`/media/file-types/${getFileIcon(fileItem.file.name)}`)} 
                          className="size-6" 
                          alt="file icon" 
                        />
                      </div>
                      
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {fileItem.file.name}
                        </span>
                        <span className="text-xs text-secondary-foreground font-medium">
                          {formatBytes(fileItem.file.size)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="size-7 rounded-lg text-gray-400 hover:text-destructive hover:bg-destructive/5 flex items-center justify-center transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(fileItem.id);
                        }}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
              <Alert variant="destructive" appearance="light" className="rounded-xl border-destructive/20">
                <AlertIcon>
                  <TriangleAlert className="size-5" />
                </AlertIcon>
                <AlertContent>
                  <AlertTitle className="text-sm font-bold">Upload Errors</AlertTitle>
                  <AlertDescription className="text-xs mt-1">
                    <ul className="list-disc list-inside space-y-0.5">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </AlertContent>
              </Alert>
            )}
          </SheetBody>
          <SheetFooter className="shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setShowUploadSheet(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddToUploadQueue} 
              disabled={uploadQueue.length === 0}
              className="rounded-lg shadow-sm"
            >
              Add {uploadQueue.length > 0 ? `${uploadQueue.length} Files` : 'to Queue'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Assign Access Dialog */}
      <Dialog open={accessDialogOpen} onOpenChange={setAccessDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Document Access Overrides
            </DialogTitle>
            <DialogDescription>
              Set document-specific access levels for <strong>{selectedDoc?.file_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col flex-1 overflow-hidden py-4 gap-4">
            {/* Admin Notice */}
            <Alert appearance="light" className="bg-blue-50 border-blue-100 py-3 rounded-xl">
              <AlertIcon>
                <Info className="size-4 text-blue-600" />
              </AlertIcon>
              <AlertContent>
                <AlertDescription className="text-[11px] text-blue-800 leading-tight">
                  Overrides take precedence over global Role permissions. Standard users only see documents where their effective access is not "No Access".
                </AlertDescription>
              </AlertContent>
            </Alert>

            {/* Role Matrix Section */}
            <div className="flex flex-col flex-1 min-h-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <Label className="text-xs font-bold uppercase text-gray-500">Permission Matrix</Label>
                  <p className="text-[10px] text-muted-foreground">Modify access for individual roles.</p>
                </div>
                {/* Search Bar */}
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-gray-400" />
                  <Input
                    placeholder="Search roles..."
                    className="pl-8 h-8 text-[11px] rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Role List */}
              <ScrollArea className="h-[300px] rounded-xl border bg-gray-50/30">
                <div className="divide-y">
                  {permissionsLoading ? (
                    <div className="text-center py-12 text-xs text-gray-400 animate-pulse font-medium">
                      Loading overrides...
                    </div>
                  ) : filteredRoles.map((role) => {
                    const inheritedLevel = getInheritedLevel(role.id);
                    const currentLevel = getEffectiveLevel(role.id);
                    const hasOverride = !!overrides[role.id];
                    const isAdminRole = (globalPermissions.find(p => p.role_id === role.id) as any)?.access_control === ACCESS_LEVEL.FULL;
                    
                    return (
                      <div 
                        key={role.id} 
                        className={cn(
                          "flex items-center justify-between p-3 transition-colors",
                          hasOverride ? "bg-amber-50/50" : "hover:bg-gray-100/50"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn(
                            "size-8 rounded-full border flex items-center justify-center shrink-0",
                            hasOverride ? "bg-amber-100 border-amber-200" : "bg-white border-gray-200"
                          )}>
                            <Users className={cn("size-4", hasOverride ? "text-amber-600" : "text-gray-400")} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {role.role_name}
                              </span>
                              {hasOverride && (
                                <Badge variant="secondary" className="text-[8px] h-3.5 px-1 bg-amber-500 text-white border-none uppercase tracking-tighter">
                                  Override
                                </Badge>
                              )}
                              {isAdminRole && (
                                <Badge variant="secondary" className="text-[8px] h-3.5 px-1 bg-blue-100 text-blue-700 border-none uppercase tracking-tighter">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <Select 
                              value={overrides[role.id] || 'inherit'} 
                              onValueChange={(val) => setOverride(role.id, val as any)}
                              disabled={isAdminRole}
                            >
                              <SelectTrigger className={cn(
                                "h-8 w-44 text-xs rounded-lg",
                                hasOverride ? "border-amber-400 bg-white ring-amber-400/20" : "bg-white",
                                isAdminRole && "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                              )}>
                                <SelectValue placeholder="Select access" />
                              </SelectTrigger>
                              <SelectContent>
                                {ACCESS_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {hasOverride && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="size-8 text-gray-400 hover:text-destructive shrink-0"
                                onClick={() => setOverride(role.id, 'inherit')}
                                title="Reset to Baseline"
                              >
                                <KeenIcon icon="cross" className="!text-sm" />
                              </Button>
                            )}
                          </div>
                          {!hasOverride && (
                            <span className="text-[10px] text-gray-500 pr-1">
                              Inheriting: <span className="font-medium text-gray-700">{inheritedLevel === ACCESS_LEVEL.NONE ? 'No Access' : inheritedLevel === ACCESS_LEVEL.FULL ? 'Edit' : 'Read-only'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setAccessDialogOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpdateAccess}
              loading={updatePermissions.isPending}
              className="rounded-lg"
            >
              Apply All Overrides
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
