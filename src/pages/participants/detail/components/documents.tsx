import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, CloudUpload, TriangleAlert, Trash2, X, Shield, Lock, Info } from 'lucide-react';
import { useParticipantDocuments, getParticipantFileUrl as getFileUrl, useUpdateParticipantDocument, ParticipantDocument } from '@/hooks/use-participant-documents';
import { useRoles } from '@/hooks/use-roles';
import { useDocumentRolePermissions, useUpdateDocumentRolePermissions } from '@/hooks/use-document-role-permissions';
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
import { useRBAC } from '@/hooks/useRBAC';

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
import { Switch } from '@/components/ui/switch';

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
  
  // Access state for the dialog
  const [isRestricted, setIsRestricted] = useState(false);
  const [assignedRoles, setAssignedRoles] = useState<Array<{ role_id: string; role_name: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: documents = [], isLoading: loading } = useParticipantDocuments(participantId);
  const updateDoc = useUpdateParticipantDocument();
  const { roles: allRoles } = useRoles();
  const { data: existingPermissions, isLoading: permissionsLoading } = useDocumentRolePermissions(selectedDoc?.id);
  const updatePermissions = useUpdateDocumentRolePermissions();
  const { isAdmin } = useRBAC();

  // Sync assigned roles when existingPermissions data is fetched/changed
  useEffect(() => {
    if (accessDialogOpen && existingPermissions) {
      setAssignedRoles(existingPermissions.map((p: any) => ({
        role_id: p.role_id,
        role_name: p.role?.role_name || 'Unknown Role',
      })));
    }
  }, [existingPermissions, accessDialogOpen]);

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

  const handleOpenAccessDialog = (doc: ParticipantDocument) => {
    setSelectedDoc(doc);
    setIsRestricted(doc.is_restricted || false);
    setAssignedRoles([]); // Clear until query fetches fresh data
    setAccessDialogOpen(true);
  };

  const handleUpdateAccess = async () => {
    if (!selectedDoc || !participantId) return;

    try {
      // 1. Update the document's restriction toggle
      await updateDoc.mutateAsync({
        id: selectedDoc.id,
        participantId,
        updates: {
          is_restricted: isRestricted,
        },
      });

      // 2. Update the role-based permissions
      await updatePermissions.mutateAsync({
        documentId: selectedDoc.id,
        roles: assignedRoles.map(r => ({
          role_id: r.role_id,
          access_level: 'read_only', // Default access for roles
        })),
      });

      toast.success('Document access updated successfully');
      setAccessDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to update access: ${error.message}`);
    }
  };

  const toggleRoleAssignment = (role: any) => {
    setAssignedRoles(prev => {
      const exists = prev.find(r => r.role_id === role.id);
      if (exists) {
        return prev.filter(r => r.role_id !== role.id);
      } else {
        return [...prev, {
          role_id: role.id,
          role_name: role.role_name,
        }];
      }
    });
  };

  const filteredRoles = allRoles.filter(r => 
    r.role_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={() => setShowUploadSheet(true)} disabled={!participantId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
          ) : visibleDocuments.length === 0 && (!pendingChanges?.toAdd?.length) ? (
            <div className="text-center py-12 bg-gray-50/50 border border-dashed rounded-xl">
              <KeenIcon icon="files" className="text-4xl text-gray-300 mb-3" />
              <p className="text-muted-foreground">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
              {/* Existing documents */}
              {visibleDocuments.map((doc) => {
                const isPendingDelete = pendingChanges?.toDelete?.some(pending => pending.id === doc.id);
                return (
                  <ContextMenu key={doc.id}>
                    <ContextMenuTrigger asChild>
                      <div 
                        className={cn(
                          "flex flex-col items-center justify-start p-1.5 rounded-lg hover:bg-gray-50 transition-all relative group text-center w-full min-h-[85px] cursor-context-menu",
                          isPendingDelete && "opacity-60 grayscale bg-destructive/5",
                          doc.is_restricted && "bg-amber-50/30 border border-amber-100/50 shadow-xs"
                        )}
                      >
                        <div className="size-10 flex items-center justify-center shrink-0 mb-1 group-hover:scale-110 transition-transform relative">
                          <img 
                            src={toAbsoluteUrl(`/media/file-types/${getFileIcon(doc.file_name)}`)} 
                            className="size-8" 
                            alt="file icon" 
                          />
                          {doc.is_restricted && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm border border-white">
                              <Lock className="size-2.5" />
                            </div>
                          )}
                        </div>
                        
                        <span className={cn(
                          "text-[10px] font-normal text-gray-800 break-words w-full px-0.5 leading-[1.1] line-clamp-3",
                          isPendingDelete && "line-through",
                          doc.is_restricted && "text-amber-900 font-medium"
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
                              >                                <KeenIcon icon="cloud-download" className="!text-[9px]" />
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
                      
                      {isAdmin && (
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Document Access Settings
            </DialogTitle>
            <DialogDescription>
              Configure privacy and classification for <strong>{selectedDoc?.file_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Admin Notice */}
            <Alert appearance="light" className="bg-blue-50 border-blue-100 py-3 rounded-xl">
              <AlertIcon>
                <Info className="size-4 text-blue-600" />
              </AlertIcon>
              <AlertContent>
                <AlertDescription className="text-[11px] text-blue-800 leading-tight">
                  Admin users and those with Full access to participant documents have access to all documents by default.
                </AlertDescription>
              </AlertContent>
            </Alert>

            {/* Restricted Toggle */}
            <div className="flex items-center justify-between space-x-4 rounded-xl border p-4 shadow-sm bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  isRestricted ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"
                )}>
                  <Lock className="size-4" />
                </div>
                <div className="space-y-0.5">
                  <Label htmlFor="restricted" className="text-sm font-bold">Restricted Access</Label>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Only managers and admins can view this document by default.
                  </p>
                </div>
              </div>
              <Switch
                id="restricted"
                checked={isRestricted}
                onCheckedChange={setIsRestricted}
              />
            </div>

            {/* Role Permissions Section */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-bold uppercase text-gray-500">Role-Based Access</Label>
                <p className="text-[11px] text-muted-foreground">
                  Select which additional Roles can view this document when restricted.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-gray-400" />
                <Input
                  placeholder="Search roles..."
                  className="pl-9 h-9 text-sm rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Role List */}
              <ScrollArea className="h-[200px] rounded-xl border bg-gray-50/30 p-2">
                <div className="space-y-1">
                  {permissionsLoading ? (
                    <div className="text-center py-12 text-xs text-gray-400 animate-pulse font-medium">
                      Loading permissions...
                    </div>
                  ) : filteredRoles.map((role) => {
                    const isAssigned = assignedRoles.some(r => r.role_id === role.id);
                    return (
                      <div 
                        key={role.id} 
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg transition-colors",
                          isAssigned ? "bg-primary/5 border border-primary/10" : "hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="size-7 rounded-full bg-gray-100 border flex items-center justify-center shrink-0">
                            <Users className="size-3.5 text-gray-500" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-gray-900 truncate">
                              {role.role_name}
                            </span>
                            <span className="text-[10px] text-gray-500 truncate">
                              {role.assigned_count} members
                            </span>
                          </div>
                        </div>

                        <Button
                          variant={isAssigned ? "secondary" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-7 px-2 text-[10px] font-bold uppercase rounded-md",
                            isAssigned ? "text-primary hover:bg-primary/10" : "text-gray-500"
                          )}
                          onClick={() => toggleRoleAssignment(role)}
                        >
                          {isAssigned ? (
                            <>
                              <UserMinus className="size-3 me-1" />
                              Remove
                            </>
                          ) : (
                            <>
                              <UserPlus className="size-3 me-1" />
                              Assign
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                  {!permissionsLoading && filteredRoles.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400 font-medium">
                      No roles found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Selected Summary */}
              {assignedRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase w-full mb-0.5">
                    Assigned Roles ({assignedRoles.length})
                  </span>
                  {assignedRoles.map((role) => (
                    <Badge 
                      key={role.role_id} 
                      variant="secondary" 
                      className="gap-1 pl-1.5 pr-1.5 py-0.5 text-[10px] font-medium bg-white border border-gray-200 shadow-xs rounded-lg"
                    >
                      <Users className="size-2.5 text-gray-400" />
                      {role.role_name}
                      <button 
                        onClick={() => setAssignedRoles(prev => prev.filter(r => r.role_id !== role.role_id))}
                        className="hover:text-destructive transition-colors ml-0.5"
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAccessDialogOpen(false)} className="rounded-lg">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpdateAccess}
              loading={updateDoc.isPending}
              className="rounded-lg"
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
