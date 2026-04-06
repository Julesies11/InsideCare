import { ChecklistCard } from '@/components/checklists/checklist-card';
import { cn } from '@/lib/utils';
import { CheckSquare } from 'lucide-react';
import { useMemo } from 'react';

interface ShiftChecklistPickerProps {
  checklists: any[];
  selectedIds: string[];
  onToggle: (id: string, name: string) => void;
  readOnly?: boolean;
}

/**
 * Reusable component for selecting checklists within a shift.
 * Uses the standard ChecklistCard but with compact settings.
 */
export function ShiftChecklistPicker({ 
  checklists, 
  selectedIds, 
  onToggle, 
  readOnly = false 
}: ShiftChecklistPickerProps) {
  // Sort checklists so selected ones appear at the top
  // We exclude selectedIds from the dependencies to prevent re-sorting while the user is picking
  const sortedChecklists = useMemo(() => {
    return [...checklists].sort((a, b) => {
      const aSelected = selectedIds.includes(a.id);
      const bSelected = selectedIds.includes(b.id);
      
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      
      // Secondary sort by sort_order
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklists]); // ONLY re-sort when the master list changes, NOT when selection changes

  if (checklists.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-xs text-muted-foreground italic">No checklists available for this house.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {sortedChecklists.map((cl) => {
        const isSelected = selectedIds.includes(cl.id);
        
        return (
          <div 
            key={cl.id}
            className={cn(
              "relative transition-all",
              !readOnly && "cursor-pointer active:scale-[0.98]"
            )}
            onClick={() => !readOnly && onToggle(cl.id, cl.name)}
          >
            {/* Overlay Selection Indicator */}
            <div className={cn(
              "absolute top-3 right-3 z-20 size-5 rounded-full border-2 flex items-center justify-center transition-colors",
              isSelected ? "bg-green-500 border-green-500 text-white shadow-sm" : "bg-white border-gray-200 text-transparent"
            )}>
              <CheckSquare className="size-3" />
            </div>

            <div className={cn(
              "h-full rounded-xl transition-all border-2",
              isSelected ? "border-green-500 ring-2 ring-green-500/10" : "border-transparent"
            )}>
              <ChecklistCard 
                checklist={{
                  ...cl,
                  items: cl.items?.map((item: any) => ({ ...item, is_required: false })) // Hide required tag by setting to false for preview
                }}
                showTasksPreview={true}
                maxTasksPreview={2}
                renderActions={() => null}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
