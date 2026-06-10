import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  Trash2, 
  Loader2, 
  FileText, 
  ShieldAlert 
} from 'lucide-react';
import { staffDetailsApi } from '@/api/staff-details.api';
import { useAuth } from '@/auth/context/auth-context';
import { useIDDocumentTypes } from '@/hooks/use-staff';
import { Database } from '@/models/database.types';

type IDDocumentType = Database['public']['Tables']['ic_id_document_types']['Row'];

interface VerifiedDocument {
  document_type: string;
  document_number: string;
  expiry_date: string;
  file_name: string | null;
  file_path: string | null;
  comments: string;
}

interface IDVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
  initialVerifiedDocuments: any[] | null;
  onSave: (verifiedDocuments: any[], calculatedExpiry: string | null, status: 'complete' | 'in_progress') => void;
}

export function IDVerificationModal({
  open,
  onOpenChange,
  staffId,
  staffName,
  initialVerifiedDocuments,
  onSave,
}: IDVerificationModalProps) {
  const { user } = useAuth();
  const userName = user?.fullname || user?.email || 'System';

  const { idDocumentTypes: ID_DOCUMENT_TYPES = [], isLoading: loadingTypes } = useIDDocumentTypes();

  const [selectedDocs, setSelectedDocs] = useState<Record<string, VerifiedDocument>>({});
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  // Initialize from verified_documents when modal opens
  useEffect(() => {
    if (open) {
      if (initialVerifiedDocuments && initialVerifiedDocuments.length > 0) {
        const docMap: Record<string, VerifiedDocument> = {};
        initialVerifiedDocuments.forEach((doc: any) => {
          docMap[doc.document_type] = {
            document_type: doc.document_type,
            document_number: doc.document_number || '',
            expiry_date: doc.expiry_date || '',
            file_name: doc.file_name || null,
            file_path: doc.file_path || null,
            comments: doc.comments || ''
          };
        });
        setSelectedDocs(docMap);
      } else {
        setSelectedDocs({});
      }
    }
  }, [open, initialVerifiedDocuments]);

  const totalPoints = useMemo(() => {
    let tally = 0;

    // Identify selected primary IDs and sort them to have a stable 'first' one
    const selectedPrimaryIds = Object.keys(selectedDocs)
      .filter(key => ID_DOCUMENT_TYPES.find(d => d.id === key)?.category === 'primary')
      .sort();

    const firstPrimaryId = selectedPrimaryIds[0];

    Object.keys(selectedDocs).forEach(key => {
      const docType = ID_DOCUMENT_TYPES.find(d => d.id === key);
      if (!docType) return;

      if (docType.category === 'primary') {
        if (key === firstPrimaryId) {
          tally += docType.points; // First primary is full points (70)
        } else {
          // Subsequent primaries do not count towards the 100 points
          tally += 0; 
        }
      } else {
        tally += docType.points;
      }
    });

    return tally;
  }, [selectedDocs, ID_DOCUMENT_TYPES]);

  const firstPrimaryId = useMemo(() => {
    return Object.keys(selectedDocs)
      .filter(key => ID_DOCUMENT_TYPES.find(d => d.id === key)?.category === 'primary')
      .sort()[0];
  }, [selectedDocs, ID_DOCUMENT_TYPES]);

  const primaryDocCount = useMemo(() => {
    return Object.keys(selectedDocs).filter(key => {
      const docType = ID_DOCUMENT_TYPES.find(d => d.id === key);
      return docType?.category === 'primary';
    }).length;
  }, [selectedDocs, ID_DOCUMENT_TYPES]);

  const handleCheckboxChange = (typeId: string, checked: boolean) => {
    setSelectedDocs(prev => {
      const next = { ...prev };
      if (checked) {
        next[typeId] = {
          document_type: typeId,
          document_number: '',
          expiry_date: '',
          file_name: null,
          file_path: null,
          comments: ''
        };
      } else {
        delete next[typeId];
      }
      return next;
    });
  };

  const handleFieldChange = (typeId: string, field: 'document_number' | 'expiry_date' | 'comments', value: string) => {
    setSelectedDocs(prev => {
      if (!prev[typeId]) return prev;
      return {
        ...prev,
        [typeId]: {
          ...prev[typeId],
          [field]: value
        }
      };
    });
  };

  const handleFileUpload = async (typeId: string, file: File) => {
    try {
      setUploadingDocId(typeId);
      const data = await staffDetailsApi.documents.upload(staffId, file, userName);
      
      setSelectedDocs(prev => {
        if (!prev[typeId]) return prev;
        return {
          ...prev,
          [typeId]: {
            ...prev[typeId],
            file_name: data.file_name,
            file_path: data.file_path
          }
        };
      });
      toast.success(`Uploaded ${file.name} successfully`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleRemoveFile = (typeId: string) => {
    setSelectedDocs(prev => {
      if (!prev[typeId]) return prev;
      return {
        ...prev,
        [typeId]: {
          ...prev[typeId],
          file_name: null,
          file_path: null
        }
      };
    });
  };

  const handleSave = () => {
    // If user has unclicked everything, we allow saving to clear it
    if (Object.keys(selectedDocs).length === 0) {
      onSave([], null, 'in_progress');
      onOpenChange(false);
      return;
    }

    const calculatedStatus = totalPoints >= 100 ? 'complete' : 'in_progress';

    if (totalPoints < 100) {
      toast.info('Identity points tally is currently below 100. This verification will be saved as "In Progress".');
    }

    // Validation check: ensure required fields are filled for SELECTED documents
    for (const [typeId, doc] of Object.entries(selectedDocs)) {
      const typeDef = ID_DOCUMENT_TYPES.find(d => d.id === typeId);
      if (!typeDef) continue;
      
      if (!doc.document_number.trim()) {
        toast.error(`Please enter the document number for ${typeDef.name}.`);
        return;
      }
      if (typeDef.expiry_date_applicable && !doc.expiry_date) {
        toast.error(`Expiry date is required for ${typeDef.name}.`);
        return;
      }
    }

    // Dynamic Expiry Calculation: Minimum expiry date among all documents with expiry dates
    let minExpiry: string | null = null;
    Object.values(selectedDocs).forEach(doc => {
      if (doc.expiry_date) {
        if (!minExpiry || doc.expiry_date < minExpiry) {
          minExpiry = doc.expiry_date;
        }
      }
    });

    const documentsArray = Object.values(selectedDocs).map(doc => {
      const typeDef = ID_DOCUMENT_TYPES.find(d => d.id === doc.document_type);
      let assignedPoints = typeDef?.points || 0;

      // Apply the 'One Primary' rule: only the first selected primary gets points
      if (typeDef?.category === 'primary' && doc.document_type !== firstPrimaryId) {
        assignedPoints = 0;
      }

      return {
        ...doc,
        points: assignedPoints,
        expiry_date: doc.expiry_date || null
      };
    });


    onSave(documentsArray, minExpiry, calculatedStatus);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-150">
          <DialogTitle className="text-xl">100 Points of Identity Verification</DialogTitle>
          <DialogDescription className="text-sm">
            Verify the identity of <strong>{staffName}</strong>. Select the documents sighted, enter their reference details, and attach supporting files.
          </DialogDescription>
        </DialogHeader>

        {/* Tally Progress Bar */}
        <div className="px-6 py-4 bg-accent/30 border-b border-gray-150">
          <div className="flex justify-between items-center mb-1 text-sm font-semibold">
            <span className="flex items-center gap-1.5">
              {totalPoints >= 100 ? (
                <CheckCircle2 className="size-4.5 text-success" />
              ) : (
                <AlertCircle className="size-4.5 text-warning" />
              )}
              Tally Status: {totalPoints >= 100 ? 'Verification Criteria Met' : 'Insufficient Points'}
            </span>
            <span className={totalPoints >= 100 ? 'text-success' : 'text-warning'}>
              {totalPoints} / 100 Points
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${totalPoints >= 100 ? 'bg-success' : 'bg-warning'}`}
              style={{ width: `${Math.min((totalPoints / 100) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Rule Information Alert */}
        {primaryDocCount > 1 && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-100 flex items-start gap-3">
            <ShieldAlert className="size-4.5 text-red-600 mt-0.5 shrink-0" />
            <div className="text-[11px] text-red-800 leading-normal">
              <span className="font-bold block mb-0.5">Note: Australian "One Primary" Rule</span>
              You have selected {primaryDocCount} primary documents. Only the first primary counts for 70 points; subsequent primary documents do not contribute additional points to the 100-point tally.
            </div>
          </div>
        )}

        {/* Form Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingTypes ? (
            <div className="py-20 text-center text-muted-foreground animate-pulse">
              Loading document configurations...
            </div>
          ) : (
            <>
              {/* Primary Documents (70 points) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Primary Documents (70 Points each)</h3>
                <div className="grid gap-4.5">
                  {ID_DOCUMENT_TYPES.filter(d => d.category === 'primary').map(doc => {
                    const isSelected = !!selectedDocs[doc.id];
                    const info = selectedDocs[doc.id];

                    return (
                      <div key={doc.id} className={`p-4 border rounded-lg transition-all ${isSelected ? 'border-primary/40 bg-primary/5' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Checkbox 
                              id={`check-${doc.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleCheckboxChange(doc.id, checked as boolean)}
                            />
                            <Label htmlFor={`check-${doc.id}`} className="font-semibold text-slate-800 cursor-pointer">
                              {doc.name}
                            </Label>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {isSelected && doc.id !== firstPrimaryId ? '+0 pts' : `+${doc.points} pts`}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {doc.document_number_applicable && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Doc Reference / No.</Label>
                                <Input 
                                  value={info.document_number}
                                  onChange={(e) => handleFieldChange(doc.id, 'document_number', e.target.value)}
                                  placeholder={doc.placeholder || 'Document Number'}
                                  className="h-9 text-xs"
                                />
                              </div>
                            )}
                            {doc.expiry_date_applicable && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">
                                  Expiry Date <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                  type="date"
                                  value={info.expiry_date}
                                  onChange={(e) => handleFieldChange(doc.id, 'expiry_date', e.target.value)}
                                  className="h-9 text-xs"
                                />
                              </div>
                            )}

                            {doc.comments_applicable && (
                              <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Sighting Notes / Comments</Label>
                                <Input 
                                  value={info.comments}
                                  onChange={(e) => handleFieldChange(doc.id, 'comments', e.target.value)}
                                  placeholder="e.g. Sighted original document"
                                  className="h-9 text-xs"
                                />
                              </div>
                            )}
                            
                            {/* File Upload Section */}
                            {doc.attachment_applicable && (
                              <div className="md:col-span-2 space-y-1.5 pt-1">
                                <Label className="text-xs font-medium text-slate-600">Upload Attachment (Optional)</Label>
                                {info.file_name ? (
                                  <div className="flex items-center justify-between p-2 bg-gray-100 border border-gray-200 rounded-md">
                                    <span className="text-xs flex items-center gap-1.5 text-slate-700 truncate max-w-[80%]">
                                      <FileText className="size-4 text-primary shrink-0" />
                                      {info.file_name}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveFile(doc.id)}
                                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <input
                                      type="file"
                                      id={`file-${doc.id}`}
                                      className="hidden"
                                      disabled={uploadingDocId !== null}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(doc.id, file);
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={uploadingDocId !== null}
                                      onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                                      className="w-full text-xs h-9 border-dashed border-gray-300 hover:border-primary/50"
                                    >
                                      {uploadingDocId === doc.id ? (
                                        <>
                                          <Loader2 className="size-3.5 mr-2 animate-spin" />
                                          Uploading File...
                                        </>
                                      ) : (
                                        <>
                                          <UploadCloud className="size-3.5 mr-2" />
                                          Attach Document File
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Documents (40/25 points) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Secondary Documents (40 / 25 Points)</h3>
                <div className="grid gap-4.5">
                  {ID_DOCUMENT_TYPES.filter(d => d.category === 'secondary').map(doc => {
                    const isSelected = !!selectedDocs[doc.id];
                    const info = selectedDocs[doc.id];

                    return (
                      <div key={doc.id} className={`p-4 border rounded-lg transition-all ${isSelected ? 'border-primary/40 bg-primary/5' : 'border-gray-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Checkbox 
                              id={`check-${doc.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleCheckboxChange(doc.id, checked as boolean)}
                            />
                            <Label htmlFor={`check-${doc.id}`} className="font-semibold text-slate-800 cursor-pointer">
                              {doc.name}
                            </Label>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-150 text-slate-700">
                            +{doc.points} pts
                          </span>
                        </div>

                        {isSelected && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {doc.document_number_applicable && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Doc Reference / No.</Label>
                                <Input 
                                  value={info.document_number}
                                  onChange={(e) => handleFieldChange(doc.id, 'document_number', e.target.value)}
                                  placeholder={doc.placeholder || 'Document Number'}
                                  className="h-9 text-xs"
                                />
                              </div>
                            )}
                            {doc.expiry_date_applicable && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">
                                  Expiry Date <span className="text-red-500">*</span>
                                </Label>
                                <Input 
                                  type="date"
                                  value={info.expiry_date}
                                  onChange={(e) => handleFieldChange(doc.id, 'expiry_date', e.target.value)}
                                  className="h-9 text-xs"
                                />
                              </div>
                            )}

                            {doc.comments_applicable && (
                              <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Sighting Notes / Comments</Label>
                                <Input 
                                  value={info.comments}
                                  onChange={(e) => handleFieldChange(doc.id, 'comments', e.target.value)}
                                  placeholder="e.g. Sighted original document"
                                  className="h-9 text-xs"
                                />
                              </div>
                            )}
                            
                            {/* File Upload Section */}
                            {doc.attachment_applicable && (
                              <div className="md:col-span-2 space-y-1.5 pt-1">
                                <Label className="text-xs font-medium text-slate-600">Upload Attachment (Optional)</Label>
                                {info.file_name ? (
                                  <div className="flex items-center justify-between p-2 bg-gray-100 border border-gray-200 rounded-md">
                                    <span className="text-xs flex items-center gap-1.5 text-slate-700 truncate max-w-[80%]">
                                      <FileText className="size-4 text-primary shrink-0" />
                                      {info.file_name}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveFile(doc.id)}
                                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <input
                                      type="file"
                                      id={`file-${doc.id}`}
                                      className="hidden"
                                      disabled={uploadingDocId !== null}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(doc.id, file);
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      disabled={uploadingDocId !== null}
                                      onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                                      className="w-full text-xs h-9 border-dashed border-gray-300 hover:border-primary/50"
                                    >
                                      {uploadingDocId === doc.id ? (
                                        <>
                                          <Loader2 className="size-3.5 mr-2 animate-spin" />
                                          Uploading File...
                                        </>
                                      ) : (
                                        <>
                                          <UploadCloud className="size-3.5 mr-2" />
                                          Attach Document File
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="p-6 border-t border-gray-150 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldAlert className="size-4 text-warning" />
            Min. 100 points required to complete verification.
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={uploadingDocId !== null}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={uploadingDocId !== null || loadingTypes}
              className="bg-primary hover:bg-primary/95"
            >
              Save Verification
            </Button>

          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
