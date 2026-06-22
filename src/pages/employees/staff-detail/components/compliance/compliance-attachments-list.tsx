import React, { useState } from 'react';
import { staffDetailsApi } from '@/api/staff-details.api';
import { ResolvedComplianceItem } from '@/models/compliance.types';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toAbsoluteUrl } from '@/lib/helpers';

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

interface ComplianceAttachmentsListProps {
  staffId: string;
  userName: string;
  item: ResolvedComplianceItem;
  canEdit: boolean;
  onAddAttachment: (fileData: { file_name: string; file_path: string }) => void;
  onRemoveAttachment: (filePath: string) => void;
}

export const ComplianceAttachmentsList = React.memo(
  function ComplianceAttachmentsList({
    staffId,
    userName,
    item,
    canEdit,
    onAddAttachment,
    onRemoveAttachment,
  }: ComplianceAttachmentsListProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileUpload = async (file: File) => {
      try {
        setIsUploading(true);
        const data = await staffDetailsApi.documents.upload(
          staffId,
          file,
          userName,
        );
        onAddAttachment({
          file_name: data.file_name,
          file_path: data.file_path,
        });
        toast.success(`Uploaded ${file.name} successfully`);
      } catch (err: any) {
        console.error(err);
        toast.error(`Upload failed: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    };

    const handleViewDocument = async (filePath: string) => {
      try {
        const url =
          await staffDetailsApi.documents.getAttachmentSignedUrl(filePath);
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to open document');
      }
    };

    return (
      <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-200 mt-4">
        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
          Attachments
        </Label>
        <div className="flex flex-col gap-2">
          {item.verifiedDocuments && item.verifiedDocuments.length > 0 ? (
            <div className="grid grid-cols-1 gap-1.5">
              {item.verifiedDocuments.map((doc, idx) => {
                if (doc.document_type !== 'attachment') return null; // Only show generic attachments here
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between h-8 px-2.5 bg-white border border-gray-200 rounded text-[11px] group transition-colors hover:border-primary/30"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        doc.file_path && handleViewDocument(doc.file_path)
                      }
                      className="flex items-center gap-2 max-w-[280px] group cursor-pointer text-start truncate min-w-0"
                    >
                      <img
                        src={toAbsoluteUrl(
                          `/media/file-types/${getFileIcon(doc.file_name || '')}`,
                        )}
                        className="size-5 shrink-0 transition-opacity group-hover:opacity-80"
                        alt="file icon"
                      />
                      <span
                        className="text-[11px] text-muted-foreground truncate group-hover:text-primary group-hover:underline transition-colors"
                        title={doc.file_name || 'File'}
                      >
                        {doc.file_name}
                      </span>
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          doc.file_path && onRemoveAttachment(doc.file_path)
                        }
                        className="text-slate-400 hover:text-destructive transition-colors px-1"
                        aria-label="Remove attachment"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 italic block mb-1">
              No files attached
            </span>
          )}

          {canEdit && (
            <div className="relative mt-1">
              <input
                type="file"
                id={`file-${item.requirementId}`}
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  // Reset value so same file can be uploaded again if removed
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() =>
                  document.getElementById(`file-${item.requirementId}`)?.click()
                }
                className="w-full sm:w-auto text-[10px] h-8 border-dashed border-gray-300 hover:border-primary/50 flex items-center justify-center gap-1.5 bg-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3 animate-spin text-primary" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="size-3 text-primary" />
                    Add Attachment
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  },
);
