import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, AlertCircle, Paperclip, X, Download, FileText, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  title: string;
  instructions?: string;
  priority: string;
  is_required: boolean;
  sort_order: number;
}

interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
}

interface QueuedAttachment {
  file: File;
  tempId: string;
}

interface HouseChecklistExecutionProps {
  checklist: Checklist;
  onComplete: (results: any) => void;
  onSave: (results: any) => void;
  onCancel: () => void;
  isReadOnly?: boolean;
  initialData?: {
    completedItems: Record<string, boolean>;
    itemNotes: Record<string, string>;
    attachments?: Record<string, Attachment[]>;
  };
}

export function HouseChecklistExecution({ 
  checklist, 
  onComplete, 
  onSave,
  onCancel,
  isReadOnly = false,
  initialData 
}: HouseChecklistExecutionProps) {
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(initialData?.completedItems || {});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>(initialData?.itemNotes || {});
  const [queuedAttachments, setQueuedAttachments] = useState<Record<string, QueuedAttachment[]>>({});
  const [toDeleteAttachments, setToDeleteAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeItemIdForUpload, setActiveItemIdForUpload] = useState<string | null>(null);

  const items = [...checklist.items].sort((a, b) => a.sort_order - b.sort_order);
  const completedCount = Object.values(completedItems).filter(Boolean).length;
  const totalCount = items.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Check if all required items are completed
  const allRequiredCompleted = items
    .filter(item => item.is_required)
    .every(item => !!completedItems[item.id]);

  // Check if there are any changes (dirty state)
  const hasQueuedFiles = Object.values(queuedAttachments).some(arr => arr.length > 0);
  const hasDeletions = toDeleteAttachments.length > 0;
  
  const isDirty = JSON.stringify(completedItems) !== JSON.stringify(initialData?.completedItems || {}) ||
                  JSON.stringify(itemNotes) !== JSON.stringify(initialData?.itemNotes || {}) ||
                  hasQueuedFiles ||
                  hasDeletions;

  const handleToggleItem = (itemId: string, checked: boolean) => {
    setCompletedItems(prev => ({ ...prev, [itemId]: checked }));
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setItemNotes(prev => ({ ...prev, [itemId]: note }));
  };

  const handleFileClick = (itemId: string) => {
    setActiveItemIdForUpload(itemId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeItemIdForUpload) {
      const file = e.target.files[0];
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      
      setQueuedAttachments(prev => ({
        ...prev,
        [activeItemIdForUpload]: [...(prev[activeItemIdForUpload] || []), { file, tempId }]
      }));
      
      // Auto-check the item when a file is attached
      handleToggleItem(activeItemIdForUpload, true);
      
      e.target.value = ''; // Reset input
    }
  };

  const removeQueuedFile = (itemId: string, tempId: string) => {
    setQueuedAttachments(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || []).filter(f => f.tempId !== tempId)
    }));
  };

  const markAttachmentForDeletion = (attachmentId: string) => {
    if (confirm('Are you sure you want to delete this attachment? This cannot be undone once you save.')) {
      setToDeleteAttachments(prev => [...prev, attachmentId]);
    }
  };

  const getResults = () => {
    return {
      checklist_id: checklist.id,
      items: items.map(item => ({
        item_id: item.id,
        is_completed: !!completedItems[item.id],
        note: itemNotes[item.id] || ''
      })),
      queuedAttachments,
      toDeleteAttachments
    };
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await onSave(getResults());
      // Reset local changes state
      setQueuedAttachments({});
      setToDeleteAttachments([]);
    } catch (error) {
      // toast shown by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const missingRequired = items.filter(item => item.is_required && !completedItems[item.id]);
    if (missingRequired.length > 0) {
      toast.error(`Please complete all required items: ${missingRequired.map(i => i.title).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete({
        ...getResults(),
        completed_at: new Date().toISOString(),
      });
    } catch (error) {
      // toast shown by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return <Badge variant="outline" className="text-[9px] h-3.5 border-red-200 text-red-700 bg-red-50 font-bold">High</Badge>;
      case 'medium': return <Badge variant="outline" className="text-[9px] h-3.5 border-yellow-200 text-yellow-700 bg-yellow-50 font-bold">Medium</Badge>;
      case 'low': return <Badge variant="outline" className="text-[9px] h-3.5 border-green-200 text-green-700 bg-green-50 font-bold">Low</Badge>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
      />
      
      <div className="mb-4 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Execution Progress</span>
          <span className="text-[10px] font-bold text-primary">{completedCount} of {totalCount} completed ({progressPercent}%)</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border rounded-lg overflow-hidden border-gray-200 bg-white shadow-sm custom-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider w-[40%]">Checklist Item</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider w-[25%]">Notes</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider w-[35%] text-right px-6">Attachments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr 
                key={item.id} 
                className={`transition-colors hover:bg-gray-50/50 ${
                  completedItems[item.id] ? 'bg-green-50/10' : ''
                }`}
              >
                <td className="px-4 py-3 align-top">
                  <div className="flex gap-3">
                    <div className="pt-0.5">
                      <Checkbox 
                        id={`item-${item.id}`}
                        checked={completedItems[item.id] || false}
                        onCheckedChange={(checked) => handleToggleItem(item.id, !!checked)}
                        disabled={isReadOnly}
                        className="size-4.5 border-gray-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <label 
                          htmlFor={`item-${item.id}`}
                          className={`text-xs font-bold cursor-pointer ${
                            completedItems[item.id] ? 'text-green-800' : 'text-gray-900'
                          }`}
                        >
                          {item.title}
                        </label>
                        {item.is_required && (
                          <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1 py-0.2 rounded border border-red-100 uppercase tracking-tighter">
                            Required
                          </span>
                        )}
                        {getPriorityBadge(item.priority)}
                      </div>
                      {item.instructions && (
                        <p className="text-[10px] text-muted-foreground leading-normal whitespace-normal">
                          {item.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <Textarea 
                    placeholder="Notes..."
                    value={itemNotes[item.id] || ''}
                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                    disabled={isReadOnly}
                    className="min-h-[40px] h-[40px] text-[10px] bg-gray-50/30 border-gray-200 focus:bg-background transition-colors p-2 leading-tight resize-none w-full disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </td>
                <td className="px-4 py-3 align-top px-6">
                  <div className="flex flex-col items-end gap-2">
                    {!isReadOnly && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] gap-1 hover:bg-primary/5 hover:text-primary border border-dashed border-gray-200 px-3"
                        onClick={() => handleFileClick(item.id)}
                      >
                        <Paperclip className="size-3" />
                        Attach File
                      </Button>
                    )}
                    
                    <div className="flex flex-col items-end gap-1.5 w-full">
                      {/* Existing Attachments */}
                      {initialData?.attachments?.[item.id]?.filter(a => !toDeleteAttachments.includes(a.id)).map((file) => (
                        <div key={file.id} className="flex items-center gap-2 max-w-full bg-gray-50/80 px-2 py-1 rounded border border-gray-100 group/file">
                          <span className="text-[11px] font-medium text-gray-700 truncate max-w-[150px]">{file.file_name}</span>
                          <div className="flex items-center gap-1">
                            <Download 
                              className="size-3 text-blue-500 cursor-pointer hover:text-blue-700" 
                              onClick={() => window.open(file.file_path, '_blank')} 
                            />
                            {!isReadOnly && (
                              <Trash2 
                                className="size-3 text-gray-400 cursor-pointer hover:text-red-500" 
                                onClick={() => markAttachmentForDeletion(file.id)}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Queued Attachments */}
                      {queuedAttachments[item.id]?.map((q) => (
                        <div key={q.tempId} className="flex items-center gap-2 max-w-full bg-primary/5 px-2 py-1 rounded border border-primary/10">
                          <FileText className="size-3 text-primary" />
                          <span className="text-[11px] text-primary font-bold truncate max-w-[150px]">{q.file.name}</span>
                          {!isReadOnly && (
                            <X 
                              className="size-3 text-primary hover:text-red-500 cursor-pointer" 
                              onClick={() => removeQueuedFile(item.id, q.tempId)} 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="size-8 text-gray-200 mb-2" />
                    <p className="text-xs text-muted-foreground">This checklist has no items to complete.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-4 mt-4 border-t bg-background shrink-0">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="h-9 px-4 text-xs font-semibold">
          {isReadOnly ? 'Close' : 'Cancel'}
        </Button>
        
        {!isReadOnly && (
          <div className="flex gap-2">
            <Button 
              variant={isDirty ? "primary" : "secondary"}
              onClick={handleSaveDraft} 
              disabled={isSubmitting || !isDirty || items.length === 0} 
              className="h-9 px-4 shadow-sm font-bold text-xs min-w-[110px]"
            >
              {isSubmitting ? <Loader2 className="size-3.5 animate-spin mx-auto" /> : 'Save Progress'}
            </Button>

            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !allRequiredCompleted || items.length === 0} 
              className="bg-green-600 hover:bg-green-700 text-white h-9 px-6 shadow-sm font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <>
                  <Save className="size-3.5 mr-1.5" />
                  Complete Checklist
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
