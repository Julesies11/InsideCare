import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParticipants } from '@/hooks/use-participants';
import { useStaff } from '@/hooks/use-staff';
import { useHouses } from '@/hooks/use-houses';
import { useStaffShifts } from '@/hooks/use-staff-shifts';
import { format, subDays, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { SHIFT_PERIODS } from '@/config/enums';

interface ShiftNoteOverviewSectionProps {
  canEdit: boolean;
  formData: Record<string, unknown>;
  onFormChange: (field: string, value: unknown) => void;
  onBulkChange?: (changes: Record<string, unknown>) => void;
  isShiftLocked?: boolean;
  isParticipantLocked?: boolean;
}

export function ShiftNoteOverviewSection({
  canEdit,
  formData,
  onFormChange,
  onBulkChange,
  isShiftLocked = false,
  isParticipantLocked = false,
}: ShiftNoteOverviewSectionProps) {
  const { staff } = useStaff();
  const { houses } = useHouses();

  // Filter participants to only show active ones from the selected house (if any)
  const { participants } = useParticipants(0, 1000, [], {
    houses: formData.house_id ? [formData.house_id as string] : [],
    statuses: ['active'],
  });

  // Fetch shifts for the last 14 days to provide a good selection
  const startDate = format(subDays(new Date(), 14), 'yyyy-MM-dd');
  const endDate = format(new Date(), 'yyyy-MM-dd');
  
  // We fetch all shifts for the "Select Shift" dropdown. 
  const { shifts, loading: loadingShifts } = useStaffShifts('all', startDate, endDate);

  const handleShiftChange = (shiftId: string) => {
    if (shiftId === 'none') {
      onBulkChange?.({
        shift_id: null,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        shift_time: null,
        house_id: null,
        staff_id: null,
        shift_type: null
      });
      return;
    }

    const shift = shifts.find(s => s.id === shiftId);
    if (shift) {
      const mappedType = shift.shift_template?.toLowerCase();
      const isValidType = Object.values(SHIFT_PERIODS).includes(mappedType as any);

      onBulkChange?.({
        shift_id: shift.id,
        start_date: shift.start_date,
        shift_time: shift.start_time,
        house_id: shift.house_id,
        staff_id: shift.staff_id,
        shift_type: isValidType ? mappedType : null
      });
    }
  };

  const selectedStaff = staff.find(s => s.id === formData.staff_id);
  const selectedHouse = houses.find(h => h.id === formData.house_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shift Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift_id">Select Shift *</Label>
              <Select
                value={(formData.shift_id as string) || 'none'}
                onValueChange={handleShiftChange}
                disabled={!canEdit || isShiftLocked}
              >
                <SelectTrigger id="shift_id">
                  <SelectValue placeholder={loadingShifts ? "Loading shifts..." : "Select a shift"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select a shift...</SelectItem>
                  {shifts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {format(parseISO(s.start_date), 'EEE, MMM d')} - {s.start_time.substring(0, 5)} ({s.staff_info?.staff_name || 'Unassigned'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {isShiftLocked 
                  ? "This note is locked to the selected shift."
                  : "Selecting a shift automatically fills date, time, house, and staff."
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant_id">Participant *</Label>
              <Select
                value={(formData.participant_id as string) || 'none'}
                onValueChange={(val) => onFormChange('participant_id', val === 'none' ? null : val)}
                disabled={!canEdit || isParticipantLocked}
              >
                <SelectTrigger id="participant_id">
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select participant...</SelectItem>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.participant_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isParticipantLocked && (
                <p className="text-xs text-muted-foreground">
                  This note is locked to the selected participant.
                </p>
              )}
            </div>
          </div>

          {formData.shift_id && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Date</span>
                <p className="text-sm font-medium">{formData.start_date ? format(parseISO(formData.start_date as string), 'PPP') : 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Time</span>
                <p className="text-sm font-medium">{formData.shift_time ? (formData.shift_time as string).substring(0, 5) : 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Staff</span>
                <p className="text-sm font-medium">{selectedStaff?.staff_name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">House</span>
                <p className="text-sm font-medium">{selectedHouse?.house_name || 'N/A'}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="risks_observed">Risks observed during shift?</Label>
                <Select
                  value={formData.risks_observed === true ? 'yes' : formData.risks_observed === false ? 'no' : 'none'}
                  onValueChange={(val) => onFormChange('risks_observed', val === 'yes' ? true : val === 'no' ? false : null)}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">N/A</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.risks_observed && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                  <Label htmlFor="risk_description" className="text-xs text-muted-foreground">
                    Describe any risks or concerns observed this shift. Include what happened, what may have caused it, and what actions were taken.
                  </Label>
                  <Textarea
                    id="risk_description"
                    value={(formData.risk_description as string) || ''}
                    onChange={(e) => onFormChange('risk_description', e.target.value)}
                    placeholder="Enter risk description..."
                    rows={3}
                    disabled={!canEdit}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="overall_presentation">Overall Presentation</Label>
              <p className="text-xs text-muted-foreground">
                Describe how the participant presented across the shift (e.g. mood, engagement, behaviour, energy levels). Avoid vague terms like ‘good’ or ‘fine’.
              </p>
              <Textarea
                id="overall_presentation"
                value={(formData.overall_presentation as string) || ''}
                onChange={(e) => onFormChange('overall_presentation', e.target.value)}
                placeholder="Describe presentation..."
                rows={4}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
