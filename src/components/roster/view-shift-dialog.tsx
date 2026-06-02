import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  MapPin, 
  Users, 
  ClipboardList, 
  FileText, 
  Info,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getShiftTheme, formatTime } from './roster-utils';
import { SHIFT_ICONS, cn } from '@/lib/utils';
import { StaffShift } from './use-roster-data';

interface ViewShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: StaffShift | null;
  onWriteNote?: (shift: StaffShift) => void;
}

export function ViewShiftDialog({
  open,
  onOpenChange,
  shift,
  onWriteNote,
}: ViewShiftDialogProps) {
  if (!shift) return null;

  const isEvent = shift.entry_type === 'event';
  const themeClasses = getShiftTheme(shift.color_theme, shift.shift_template);
  const IconComponent = SHIFT_ICONS[shift.icon_name || ''] || Clock;
  const participantCount = shift.participants?.length || 0;
  const checklistCount = shift.assigned_checklists?.length || 0;

  const handleWriteNote = () => {
    onOpenChange(false);
    if (onWriteNote) {
      onWriteNote(shift);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        {/* Header Section */}
        <div className={cn("p-6 text-white relative", themeClasses.split(' ')[0].replace('/10', ''))}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <IconComponent size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 transition-colors uppercase font-bold text-[10px] tracking-widest px-2 py-0.5">
                {isEvent ? (shift.type_name || 'Meeting') : (shift.shift_template || 'Shift')}
              </Badge>
            </div>
            
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-1">
              {isEvent ? shift.title : `${formatTime(shift.start_time)} – ${formatTime(shift.end_time)}`}
            </DialogTitle>
            
            <DialogDescription className="sr-only">
              {isEvent ? `Meeting details for ${shift.title}` : `Shift details for ${shift.shift_template} at ${shift.house?.house_name}`}
            </DialogDescription>
            
            <p className="text-white/80 font-medium flex items-center gap-1.5 text-sm sm:text-base">
              <Calendar className="size-4" />
              {format(parseISO(shift.start_date), 'EEEE, d MMMM yyyy')}
              {isEvent && shift.start_time && (
                <> • {formatTime(shift.start_time)}{shift.end_time ? ` – ${formatTime(shift.end_time)}` : ''}</>
              )}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-background">
          {/* Location Info */}
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Location</p>
              <p className="text-base font-semibold text-foreground">
                {isEvent 
                  ? (shift.location || shift.house?.house_name || 'External / Office')
                  : (shift.house?.house_name || 'Assigned House')}
              </p>
            </div>
          </div>

          {/* Admin Instructions / Internal Handover Notes */}
          {shift.notes && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <Info size={40} className="text-blue-600" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Info className="size-4 text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">
                  {isEvent ? 'Event Details' : 'Instructions from Scheduler'}
                </span>
              </div>
              <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap italic">
                "{shift.notes}"
              </p>
            </div>
          )}

          {/* Participants & Involved Staff - Unified View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Participants */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Users className="size-4 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Participants ({participantCount})
                </span>
              </div>
              <div className="space-y-2">
                {shift.participants && shift.participants.length > 0 ? (
                  shift.participants.map(p => (
                    <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      <span className="text-sm font-medium truncate">{p.name || p.participant_name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic px-1">No participants involved</p>
                )}
              </div>
            </div>

            {/* Checklists (Only for shifts) or Staff (for events) */}
            <div className="space-y-3">
              {isEvent ? (
                <>
                  <div className="flex items-center gap-2 px-1">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Involved Staff</span>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-card">
                    <p className="text-sm font-medium">{shift.staff_name || 'Unassigned'}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-1">
                    <ClipboardList className="size-4 text-muted-foreground" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Checklists ({checklistCount})</span>
                  </div>
                  <div className="space-y-2">
                    {shift.assigned_checklists && shift.assigned_checklists.length > 0 ? (
                      shift.assigned_checklists.map(cl => (
                        <div key={cl.id} className="p-2.5 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={cn(
                              "text-sm truncate mr-2",
                              cl.is_completed ? "text-emerald-600 font-bold" : "text-foreground font-medium"
                            )}>
                              {cl.assignment_title}
                            </span>
                            {cl.is_completed ? (
                              <div className="size-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <CheckCircle className="size-3 text-emerald-600" />
                              </div>
                            ) : (
                              <div className="size-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Clock className="size-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic px-1">No checklists assigned</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-muted/30 border-t flex flex-row items-center justify-between gap-3">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground hover:bg-muted" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          
          {!isEvent && (
            <Button 
              onClick={handleWriteNote}
              className="bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 gap-2 font-bold px-6"
            >
              <FileText className="size-4" />
              Write Shift Note
              <ChevronRight className="size-3.5 opacity-50" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckCircle({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
