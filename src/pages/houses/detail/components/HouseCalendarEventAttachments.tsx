import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Paperclip, X, FileText, Download, Trash2, UploadCloud } from 'lucide-react';
import { HouseCalendarEventAttachment } from '@/hooks/useHouseCalendarEvents';
import { cn } from '@/lib/utils';

export interface QueuedAttachment {
  file: File;
  tempId: string;
}

interface HouseCalendarEventAttachmentsProps {
  existingAttachments: HouseCalendarEventAttachment[];
  queuedAttachments: QueuedAttachment[];
  toDeleteAttachments: string[];
  onAddQueuedFile: (file: File) => void;
  onRemoveQueuedFile: (tempId: string) => void;
  onMarkForDeletion: (attachmentId: string) => void;
  canEdit: boolean;
}

export function HouseCalendarEventAttachments({
  existingAttachments,
  queuedAttachments,
  toDeleteAttachments,
  onAddQueuedFile,
  onRemoveQueuedFile,
  onMarkForDeletion,
  canEdit,
}: HouseCalendarEventAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsToday] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        onAddQueuedFile(file);
      });
      e.target.value = ''; // Reset input
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canEdit) setIsToday(true);
  };

  const onDragLeave = () => {
    setIsToday(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsToday(false);
    if (!canEdit) return;

    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(file => {
        onAddQueuedFile(file);
      });
    }
  };

  const activeAttachments = existingAttachments.filter(
    (att) => !toDeleteAttachments.includes(att.id)
  );

  return (
    <div className="space-y-4 pt-4 border-t mt-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold uppercase text-gray-700 tracking-wider">Attachments</Label>
      </div>

      {canEdit && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2",
            isDragging 
              ? "border-primary bg-primary/5 shadow-inner" 
              : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
          <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <UploadCloud className="size-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, or Images</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Existing Attachments */}
        {activeAttachments.map((att) => (
          <div
            key={att.id}
            className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 group hover:border-primary/20 hover:bg-white transition-all shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                <FileText className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-gray-900 truncate">{att.file_name}</span>
                <span className="text-[10px] text-muted-foreground">Uploaded File</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-blue-500 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(att.file_path, '_blank');
                }}
                title="Download"
              >
                <Download className="size-4" />
              </Button>
              {canEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:bg-destructive/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkForDeletion(att.id);
                  }}
                  title="Remove"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Queued Attachments */}
        {queuedAttachments.map((q) => (
          <div
            key={q.tempId}
            className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 group hover:bg-primary/[0.08] transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-8 rounded-lg bg-white border border-primary/10 flex items-center justify-center text-primary shrink-0">
                <UploadCloud className="size-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-primary truncate">
                  {q.file.name}
                </span>
                <span className="text-[10px] text-primary/60 font-medium">Pending Upload</span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-primary hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveQueuedFile(q.tempId);
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}

        {activeAttachments.length === 0 && queuedAttachments.length === 0 && (
          <div className="col-span-full py-8 text-center bg-gray-50/30 border border-dashed rounded-xl">
            <Paperclip className="size-8 mx-auto mb-2 text-gray-300 opacity-50" />
            <p className="text-xs text-muted-foreground italic font-medium">No attachments yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
