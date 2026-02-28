import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

interface ChecklistCardProps {
  checklist: any;
  isPendingAdd?: boolean;
  isPendingUpdate?: boolean;
  isPendingDelete?: boolean;
  onEdit?: (checklist: any) => void;
  onDelete?: (checklist: any) => void;
  footer?: ReactNode;
  showTasksPreview?: boolean;
}

/**
 * Reusable Card component for displaying a Checklist Template.
 */
export function ChecklistCard({ 
  checklist, 
  isPendingAdd, 
  isPendingUpdate, 
  isPendingDelete,
  onEdit,
  onDelete,
  footer,
  showTasksPreview = true
}: ChecklistCardProps) {
  const checklistItems = checklist.items || [];
  
  const getFrequencyColor = (frequency: string) => {
    switch (frequency?.toLowerCase()) {
      case 'daily': return 'blue';
      case 'weekly': return 'purple';
      case 'monthly': return 'orange';
      case 'quarterly': return 'pink';
      default: return 'gray';
    }
  };

  return (
    <Card 
      className={`flex flex-col h-full transition-all hover:shadow-sm ${
        isPendingAdd ? 'bg-primary/5 border-primary/20' :
        isPendingDelete ? 'opacity-50 bg-destructive/5 border-destructive/20' :
        isPendingUpdate ? 'bg-warning/5 border-warning/20' : ''
      }`}
    >
      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-base font-bold text-gray-900 truncate ${isPendingDelete ? 'line-through' : ''}`}>
              {checklist.name}
            </h3>
            <Badge variant="outline" className={`text-[10px] h-4 border-${getFrequencyColor(checklist.frequency)}-200 text-${getFrequencyColor(checklist.frequency)}-600 bg-${getFrequencyColor(checklist.frequency)}-50 px-1 uppercase`}>
              {checklist.frequency}
            </Badge>
            {isPendingAdd && <Badge variant="outline" className="text-[9px] h-4 border-primary-200 text-primary bg-primary/10 px-1">PENDING ADD</Badge>}
            {isPendingUpdate && <Badge variant="outline" className="text-[9px] h-4 border-warning-200 text-warning bg-warning/10 px-1">PENDING UPDATE</Badge>}
          </div>
          {checklist.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{checklist.description}</p>}
        </div>
        
        {(onDelete) && !isPendingDelete && (
          <div className="flex gap-0.5 shrink-0 ml-2">
            {onDelete && (
              <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => onDelete(checklist)}>
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        {showTasksPreview && (
          <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[1px] before:bg-muted-foreground/10">
            {checklistItems.length === 0 ? (
              <div className="text-xs text-muted-foreground ml-6 py-2 italic">
                No tasks defined yet
              </div>
            ) : (
              checklistItems.slice(0, 3).map((item: any, index: number) => (
                <div key={item.id || item.tempId} className="flex items-start gap-3 relative z-10">
                  <div className="shrink-0 size-5 rounded-full bg-background border border-muted-foreground/30 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium text-gray-700 truncate">{item.title}</span>
                    {item.is_required && <span className="text-[9px] text-red-500">Required</span>}
                  </div>
                </div>
              ))
            )}
            {checklistItems.length > 3 && (
              <div className="ml-6 text-[10px] text-muted-foreground font-medium">
                + {checklistItems.length - 3} more tasks...
              </div>
            )}
          </div>
        )}
        {!showTasksPreview && (
          <div className="text-xs text-muted-foreground font-medium">
            <span className="text-gray-900 font-bold">{checklistItems.length}</span> tasks defined
          </div>
        )}
      </CardContent>

      {footer && (
        <div className="p-4 pt-0 mt-auto border-t border-dashed">
          {footer}
        </div>
      )}
    </Card>
  );
}
