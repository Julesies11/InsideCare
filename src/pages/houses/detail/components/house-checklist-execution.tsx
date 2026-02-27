import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, AlertCircle } from 'lucide-react';
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

interface HouseChecklistExecutionProps {
  checklist: Checklist;
  onComplete: (results: any) => void;
  onSave: (results: any) => void;
  onCancel: () => void;
  initialData?: {
    completedItems: Record<string, boolean>;
    itemNotes: Record<string, string>;
  };
}

export function HouseChecklistExecution({ 
  checklist, 
  onComplete, 
  onSave,
  onCancel,
  initialData 
}: HouseChecklistExecutionProps) {
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(initialData?.completedItems || {});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>(initialData?.itemNotes || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = [...checklist.items].sort((a, b) => a.sort_order - b.sort_order);
  const completedCount = Object.values(completedItems).filter(Boolean).length;
  const totalCount = items.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Check if all required items are completed
  const allRequiredCompleted = items
    .filter(item => item.is_required)
    .every(item => !!completedItems[item.id]);

  // Check if there are any changes compared to initial data (dirty state)
  const isDirty = JSON.stringify(completedItems) !== JSON.stringify(initialData?.completedItems || {}) ||
                  JSON.stringify(itemNotes) !== JSON.stringify(initialData?.itemNotes || {});

  const handleToggleItem = (itemId: string, checked: boolean) => {
    setCompletedItems(prev => ({ ...prev, [itemId]: checked }));
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setItemNotes(prev => ({ ...prev, [itemId]: note }));
  };

  const getResults = () => {
    return {
      checklist_id: checklist.id,
      items: items.map(item => ({
        item_id: item.id,
        is_completed: !!completedItems[item.id],
        note: itemNotes[item.id] || ''
      }))
    };
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      onSave(getResults());
      toast.success('Progress saved successfully');
    } catch (error) {
      toast.error('Failed to save progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all required items only when completing
    const missingRequired = items.filter(item => item.is_required && !completedItems[item.id]);
    if (missingRequired.length > 0) {
      toast.error(`Please complete all required items: ${missingRequired.map(i => i.title).join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const results = {
        ...getResults(),
        completed_at: new Date().toISOString(),
      };
      
      onComplete(results);
      toast.success('Checklist completed successfully');
    } catch (error) {
      toast.error('Failed to submit checklist');
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
      {/* Progress Header */}
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

      {/* Datagrid Table Area */}
      <div className="flex-1 overflow-y-auto border rounded-lg overflow-hidden border-gray-200 bg-white shadow-sm custom-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider w-2/3">Checklist Item</th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider w-1/3">Notes / Observations</th>
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
                    placeholder="Brief notes..."
                    value={itemNotes[item.id] || ''}
                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                    className="min-h-[40px] h-[40px] text-[10px] bg-gray-50/30 border-gray-200 focus:bg-background transition-colors p-2 leading-tight resize-none"
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-12 text-center">
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

      {/* Sticky Footer */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t bg-background shrink-0">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="h-9 px-4 text-xs font-semibold">
          Cancel
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant={isDirty ? "primary" : "secondary"}
            onClick={handleSaveDraft} 
            disabled={isSubmitting || !isDirty || items.length === 0} 
            className="h-9 px-4 shadow-sm font-bold text-xs"
          >
            Save Progress
          </Button>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !allRequiredCompleted || items.length === 0} 
            className="bg-green-600 hover:bg-green-700 text-white h-9 px-6 shadow-sm font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Save className="size-3.5 mr-1.5" />
                Complete Checklist
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
