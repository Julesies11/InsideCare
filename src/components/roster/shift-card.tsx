import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Clock, MapPin, User, Users, UserCheck } from 'lucide-react';
import { getShiftTheme, formatTime } from './roster-utils';
import { SHIFT_ICONS } from '@/lib/utils';

export interface ShiftCardData {
  id: string;
  start_date: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  color_theme?: string;
  icon_name?: string;
  house?: { id: string; name: string };
  staff_name?: string;
  staff_id?: string;
  participants?: Array<{ id: string; name: string }>;
  assigned_checklists?: Array<{ id: string; checklist_id: string; assignment_title: string }>;
  notesCount?: number;
}

interface ShiftCardProps {
  shift: ShiftCardData;
  compact: boolean;
  showStaffName: boolean;
  showHouseName?: boolean;
  onClick: () => void;
  onWriteNote?: (shift: ShiftCardData) => void;
  onNotesClick?: (shift: ShiftCardData) => void;
}

export function ShiftCard({ shift, compact, showStaffName, showHouseName = true, onClick, onWriteNote, onNotesClick }: ShiftCardProps) {
  const participantCount = shift.participants?.length || 0;
  const checklistCount = shift.assigned_checklists?.length || 0;
  const isUnassigned = !shift.staff_id;
  const shiftThemeClasses = getShiftTheme(shift.color_theme, shift.shift_type);
  const IconComponent = SHIFT_ICONS[shift.icon_name || ''] || Clock;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`p-1.5 mb-1 bg-card border rounded cursor-pointer hover:bg-accent/50 transition-colors group ${
          isUnassigned ? 'border-dashed border-amber-400 bg-amber-50/30' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-black leading-tight text-gray-900">
              {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
              {shift.end_date && shift.end_date !== shift.start_date && (
                <span className="ml-0.5 text-orange-500 font-bold" title="Overnight shift">+1</span>
              )}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <IconComponent className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
              <span className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground truncate">{shift.shift_type}</span>
            </div>
          </div>
        </div>

        {showStaffName && (
          <div className="flex items-center gap-1 mb-0.5 mt-1 border-t border-gray-100 pt-1">
            <User className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            <span className={`text-[10px] font-black truncate ${isUnassigned ? 'text-amber-600' : 'text-gray-700'}`}>
              {isUnassigned ? 'OPEN SHIFT' : shift.staff_name}
            </span>
          </div>
        )}

        {showHouseName && shift.house && (
          <div className="flex items-center gap-1 mb-0.5">
            <MapPin className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate font-medium">{shift.house.name}</span>
          </div>
        )}

        {participantCount > 0 && (
          <div className="flex items-center gap-1 mb-0.5">
            <Users className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground font-medium">
              {participantCount} Participant{participantCount > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {checklistCount > 0 && (
          <div className="flex items-center gap-1 mt-1 pt-1 border-t border-dashed">
            <ClipboardList className="h-2.5 w-2.5 text-primary shrink-0" />
            <span className="text-[9px] font-black text-primary uppercase tracking-tight">
              {checklistCount} Checklist{checklistCount > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="flex items-center justify-end mt-1 pt-1 border-t">
          <button
            type="button"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (onNotesClick) { onNotesClick(shift); } else { onWriteNote?.(shift); } 
            }}
            className={`flex items-center gap-0.5 p-0.5 rounded transition-colors ${
              (shift.notesCount ?? 0) > 0
                ? 'text-emerald-600 hover:text-emerald-700'
                : 'text-red-400 hover:text-red-500'
            }`}
          >
            <ClipboardList className="h-2.5 w-2.5" />
            <span className="text-[9px] font-black">
              {shift.notesCount ?? 0}
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <Card
      onClick={onClick}
      className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden group ${
        isUnassigned ? 'border-dashed border-amber-400 bg-amber-50/20 shadow-inner' : ''
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-gray-900 leading-none mb-1.5">
              {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
              {shift.end_date && shift.end_date !== shift.start_date && (
                <span className="ml-1 text-orange-500 text-[10px]" title="Overnight shift">+1 day</span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={cn("size-2 rounded-full shrink-0", shiftThemeClasses.split(' ')[0].replace('bg-', 'bg-').replace('/10', ''))} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{shift.shift_type}</span>
            </div>
          </div>
          {isUnassigned && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[8px] font-black px-1 py-0 uppercase">Open</Badge>
          )}
        </div>
        
        <div className="space-y-1.5 mt-1 pt-1.5 border-t border-gray-100">
          {showStaffName && (
            <div className="flex items-center gap-2">
              <User className={`h-3.5 w-3.5 flex-shrink-0 ${isUnassigned ? 'text-amber-500' : 'text-gray-400'}`} />
              <span className={`text-xs truncate font-black ${isUnassigned ? 'text-amber-700 uppercase tracking-tight' : 'text-gray-700'}`}>
                {isUnassigned ? 'Unassigned' : shift.staff_name}
              </span>
            </div>
          )}

          {showHouseName && shift.house && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs truncate font-bold text-gray-600">{shift.house.name}</span>
            </div>
          )}

          {shift.participants && shift.participants.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs truncate font-bold text-gray-600">
                {shift.participants.length} Participant{shift.participants.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {checklistCount > 0 && (
          <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-dashed">
            <div className="flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                {checklistCount} Checklist{checklistCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            if (onNotesClick) { onNotesClick(shift); } else { onWriteNote?.(shift); } 
          }}
          className={`w-full flex items-center justify-center gap-2 h-8 text-[10px] font-bold rounded-lg px-2 mt-1 transition-colors border ${
            (shift.notesCount ?? 0) > 0
              ? 'text-emerald-600 border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50'
              : 'text-red-400 border-red-50 bg-red-50/20 hover:bg-red-50'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          {shift.notesCount ?? 0} Note{(shift.notesCount ?? 0) !== 1 ? 's' : ''}
        </button>
      </div>
    </Card>
  );
}
