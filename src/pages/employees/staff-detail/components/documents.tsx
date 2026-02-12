import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Download, Trash2, FileText, Clock } from 'lucide-react';
import { useStaffDocuments } from '@/hooks/useStaffDocuments';
import { StaffPendingChanges } from '@/models/staff-pending-changes';

interface DocumentsProps {
  staffId?: string;
  staffName?: string;
  canAdd: boolean;
  canDelete: boolean;
  pendingChanges?: StaffPendingChanges;
  onPendingChangesChange?: (changes: StaffPendingChanges) => void;
}

export function Documents({ 
  staffId, 
  staffName, 
  canAdd, 
  canDelete,
  pendingChanges,
  onPendingChangesChange 
}: DocumentsProps) {
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { documents, loading, getFileUrl } = useStaffDocuments(staffId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !pendingChanges || !onPendingChangesChange) return;
    
    // Add to pending uploads instead of immediate save
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const newPending = {
      ...pendingChanges,
      documents: {
        ...pendingChanges.documents,
        toAdd: [
          ...pendingChanges.documents.toAdd,
          {
            file: selectedFile,
            fileName: selectedFile.name,
            tempId,
          },
        ],
      },
    };
    
    onPendingChangesChange(newPending);
    setShowUploadSheet(false);
    setSelectedFile(null);
  };

  const handleDownload = (filePath: string) => {
    const url = getFileUrl(filePath);
    window.open(url, '_blank');
  };

  const handleDelete = (id: string, filePath: string, fileName: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    
    if (confirm('Mark this document for deletion? It will be removed when you click Save Changes.')) {
      // Add to pending deletes instead of immediate delete
      const newPending = {
        ...pendingChanges,
        documents: {
          ...pendingChanges.documents,
          toDelete: [
            ...pendingChanges.documents.toDelete,
            { id, filePath, fileName },
          ],
        },
      };
      
      onPendingChangesChange(newPending);
    }
  };

  const handleCancelPendingUpload = (tempId: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    
    const newPending = {
      ...pendingChanges,
      documents: {
        ...pendingChanges.documents,
        toAdd: pendingChanges.documents.toAdd.filter(doc => doc.tempId !== tempId),
      },
    };
    
    onPendingChangesChange(newPending);
  };

  const handleCancelPendingDelete = (id: string) => {
    if (!pendingChanges || !onPendingChangesChange) return;
    
    const newPending = {
      ...pendingChanges,
      documents: {
        ...pendingChanges.documents,
        toDelete: pendingChanges.documents.toDelete.filter(doc => doc.id !== id),
      },
    };
    
    onPendingChangesChange(newPending);
  };

  // Filter out documents marked for deletion
  const visibleDocuments = documents.filter(
    doc => !pendingChanges?.documents.toDelete.some(pending => pending.id === doc.id)
  );

  return (
    <>
      <Card className="pb-2.5" id="staff_documents">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <Button variant="secondary" size="sm" className="border border-gray-300" onClick={() => setShowUploadSheet(true)} disabled={!staffId || !canAdd}>
            <Plus className="size-4 me-1.5" />
            Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
          ) : visibleDocuments.length === 0 && (!pendingChanges?.documents.toAdd.length) ? (
            <div className="text-center py-8 text-muted-foreground">No documents uploaded yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Existing documents */}
                {visibleDocuments.map((doc) => {
                  const isPendingDelete = pendingChanges?.documents.toDelete.some(pending => pending.id === doc.id);
                  return (
                    <TableRow key={doc.id} className={isPendingDelete ? 'opacity-50 bg-destructive/5' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          <span className={isPendingDelete ? 'line-through' : ''}>{doc.file_name}</span>
                          {isPendingDelete && (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <Clock className="size-3" />
                              Pending deletion
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-AU') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {!isPendingDelete && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc.file_path)}
                              >
                                <Download className="size-4" />
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(doc.id, doc.file_path, doc.file_name)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </>
                          )}
                          {isPendingDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelPendingDelete(doc.id)}
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Pending uploads */}
                {pendingChanges?.documents.toAdd.map((pending) => (
                  <TableRow key={pending.tempId} className="bg-primary/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground" />
                        <span>{pending.fileName}</span>
                        <span className="text-xs text-primary flex items-center gap-1">
                          <Clock className="size-3" />
                          Pending upload
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">Not uploaded yet</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelPendingUpload(pending.tempId)}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={showUploadSheet} onOpenChange={setShowUploadSheet}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Upload Document</SheetTitle>
            <SheetDescription>
              Upload a document for {staffName || 'this staff member'}
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
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
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowUploadSheet(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpload} disabled={!selectedFile}>
              Add to Upload Queue
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
