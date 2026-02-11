import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Users } from 'lucide-react';
import { getShiftTypeColor, getStatusVariant, formatTime } from './roster-utils';

export interface ShiftCardData {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  status: string;
  house?: { id: string; name: string };
  staff_name?: string;
  participants?: Array<{ id: string; name: string }>;
}

interface ShiftCardProps {
  shift: ShiftCardData;
  compact: boolean;
  showStaffName: boolean;
  onClick: () => void;
}

export function ShiftCard({ shift, compact, showStaffName, onClick }: ShiftCardProps) {
  const participantCount = shift.participants?.length || 0;

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="p-1.5 mb-1 bg-card border rounded cursor-pointer hover:bg-accent/50 transition-colors group"
      >
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[10px] font-medium truncate">
            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
          </span>
          <Badge className={`${getShiftTypeColor(shift.shift_type)} text-[10px] px-1 py-0`}>
            {shift.shift_type}
          </Badge>
        </div>
        {showStaffName && shift.staff_name && (
          <div className="flex items-center gap-1 mb-0.5">
            <User className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground truncate">{shift.staff_name}</span>
          </div>
        )}
        {shift.house && (
          <div className="flex items-center gap-1 mb-0.5">
            <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground truncate">{shift.house.name}</span>
          </div>
        )}
        {participantCount > 0 && (
          <div className="flex items-center gap-1 mb-0.5">
            {participantCount === 1 ? (
              <User className="h-2.5 w-2.5 text-muted-foreground" />
            ) : (
              <Users className="h-2.5 w-2.5 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground">
              {participantCount} participant{participantCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
        <Badge variant={getStatusVariant(shift.status)} className="text-[10px] px-1 py-0">
          {shift.status}
        </Badge>
      </div>
    );
  }

  return (
    <Card
      onClick={onClick}
      className="p-2.5 cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden"
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium truncate">
            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
          </span>
        </div>
        
        <div className="flex items-center gap-1 flex-wrap">
          <Badge className={`${getShiftTypeColor(shift.shift_type)} text-[10px] px-1.5 py-0`}>
            {shift.shift_type}
          </Badge>
          <Badge variant={getStatusVariant(shift.status)} className="text-[10px] px-1.5 py-0">
            {shift.status}
          </Badge>
        </div>
        
        {showStaffName && shift.staff_name && (
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate">{shift.staff_name}</span>
          </div>
        )}

        {shift.house && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs truncate">{shift.house.name}</span>
          </div>
        )}

        {shift.participants && shift.participants.length > 0 && (
          <div className="flex items-center gap-1.5">
            {shift.participants.length === 1 ? (
              <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            ) : (
              <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-xs truncate">
              {shift.participants.length} participant{shift.participants.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
